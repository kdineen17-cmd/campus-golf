import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../lib/auth";
import { courseSummary } from "./courses";

export const usersRouter = Router();

// Courses created by the signed-in user, most recent first.
usersRouter.get("/me/courses", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.userId;

  const courses = await prisma.course.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
    include: { creator: { select: { id: true, username: true } }, holes: true },
  });

  res.json(courses.map(courseSummary));
});

// The signed-in user's round history, most recent first.
usersRouter.get("/me/rounds", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.userId;

  const rounds = await prisma.round.findMany({
    where: { playerId: userId },
    orderBy: { completedAt: "desc" },
    include: {
      course: { select: { id: true, name: true, holes: { select: { par: true } } } },
    },
  });

  res.json(
    rounds.map((round) => ({
      id: round.id,
      course: {
        id: round.course.id,
        name: round.course.name,
        totalPar: round.course.holes.reduce((sum, h) => sum + h.par, 0),
      },
      totalStrokes: round.totalStrokes,
      durationSecs: round.durationSecs,
      completedAt: round.completedAt,
    }))
  );
});

// A user's public profile: stats, round history, and courses created.
// Only visible to the user themselves or an accepted friend.
usersRouter.get("/:userId/profile", requireAuth, async (req: AuthedRequest, res) => {
  const viewerId = req.user!.userId;
  const targetId = req.params.userId;

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, username: true } });
  if (!target) {
    return res.status(404).json({ error: "User not found" });
  }

  if (targetId !== viewerId) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: "accepted",
        OR: [
          { requesterId: viewerId, addresseeId: targetId },
          { requesterId: targetId, addresseeId: viewerId },
        ],
      },
    });
    if (!friendship) {
      return res.status(403).json({ error: "You can only view a friend's profile" });
    }
  }

  const [rounds, courses, friendsCount] = await Promise.all([
    prisma.round.findMany({
      where: { playerId: targetId },
      orderBy: { completedAt: "desc" },
      include: { course: { select: { id: true, name: true, holes: { select: { par: true } } } } },
    }),
    prisma.course.findMany({
      where: { creatorId: targetId },
      orderBy: { createdAt: "desc" },
      include: { creator: { select: { id: true, username: true } }, holes: true },
    }),
    prisma.friendship.count({
      where: { status: "accepted", OR: [{ requesterId: targetId }, { addresseeId: targetId }] },
    }),
  ]);

  res.json({
    user: target,
    roundsPlayed: rounds.length,
    coursesCreated: courses.length,
    friendsCount,
    rounds: rounds.map((round) => ({
      id: round.id,
      course: {
        id: round.course.id,
        name: round.course.name,
        totalPar: round.course.holes.reduce((sum, h) => sum + h.par, 0),
      },
      totalStrokes: round.totalStrokes,
      durationSecs: round.durationSecs,
      completedAt: round.completedAt,
    })),
    courses: courses.map(courseSummary),
  });
});

// Permanently delete the signed-in user's account. Cascades to every course
// they created and every round they played (on any course), per the schema's
// onDelete: Cascade on Course.creator and Round.player.
usersRouter.delete("/me", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  await prisma.user.delete({ where: { id: userId } });
  res.status(204).send();
});
