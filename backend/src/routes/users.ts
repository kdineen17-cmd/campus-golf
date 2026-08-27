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

// Permanently delete the signed-in user's account. Cascades to every course
// they created and every round they played (on any course), per the schema's
// onDelete: Cascade on Course.creator and Round.player.
usersRouter.delete("/me", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  await prisma.user.delete({ where: { id: userId } });
  res.status(204).send();
});
