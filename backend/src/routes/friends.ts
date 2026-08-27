import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../lib/auth";

export const friendsRouter = Router();

friendsRouter.use(requireAuth);

const sendRequestSchema = z.object({
  username: z.string().trim().min(1),
});

function publicUser(user: { id: string; username: string }) {
  return { id: user.id, username: user.username };
}

// Accepted friends, sorted by whoever has the most recently created course
// (friends with no courses yet sort last, by acceptance date among themselves).
friendsRouter.get("/", async (req: AuthedRequest, res) => {
  const userId = req.user!.userId;

  const friendships = await prisma.friendship.findMany({
    where: { status: "accepted", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    include: {
      requester: { select: { id: true, username: true } },
      addressee: { select: { id: true, username: true } },
    },
  });

  const friendIds = friendships.map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId));

  // Latest course per creator, in one query -- ordered desc so the first
  // occurrence of each creatorId encountered is their most recent course.
  const courses = await prisma.course.findMany({
    where: { creatorId: { in: friendIds } },
    orderBy: { createdAt: "desc" },
    select: { creatorId: true, createdAt: true },
  });
  const latestCourseByCreator = new Map<string, Date>();
  const courseCountByCreator = new Map<string, number>();
  for (const c of courses) {
    if (!latestCourseByCreator.has(c.creatorId)) {
      latestCourseByCreator.set(c.creatorId, c.createdAt);
    }
    courseCountByCreator.set(c.creatorId, (courseCountByCreator.get(c.creatorId) ?? 0) + 1);
  }

  const result = friendships.map((f) => {
    const friendId = f.requesterId === userId ? f.addresseeId : f.requesterId;
    return {
      friendshipId: f.id,
      friend: publicUser(f.requesterId === userId ? f.addressee : f.requester),
      since: f.respondedAt,
      latestCourseAt: latestCourseByCreator.get(friendId) ?? null,
      courseCount: courseCountByCreator.get(friendId) ?? 0,
    };
  });

  result.sort((a, b) => {
    if (a.latestCourseAt && b.latestCourseAt) return b.latestCourseAt.getTime() - a.latestCourseAt.getTime();
    if (a.latestCourseAt) return -1;
    if (b.latestCourseAt) return 1;
    return (b.since?.getTime() ?? 0) - (a.since?.getTime() ?? 0);
  });

  res.json(result);
});

// Pending requests you've sent and received.
friendsRouter.get("/requests", async (req: AuthedRequest, res) => {
  const userId = req.user!.userId;

  const [incoming, outgoing] = await Promise.all([
    prisma.friendship.findMany({
      where: { addresseeId: userId, status: "pending" },
      orderBy: { createdAt: "desc" },
      include: { requester: { select: { id: true, username: true } } },
    }),
    prisma.friendship.findMany({
      where: { requesterId: userId, status: "pending" },
      orderBy: { createdAt: "desc" },
      include: { addressee: { select: { id: true, username: true } } },
    }),
  ]);

  res.json({
    incoming: incoming.map((f) => ({ id: f.id, from: publicUser(f.requester), createdAt: f.createdAt })),
    outgoing: outgoing.map((f) => ({ id: f.id, to: publicUser(f.addressee), createdAt: f.createdAt })),
  });
});

// Send a friend request by username.
friendsRouter.post("/requests", async (req: AuthedRequest, res) => {
  const parsed = sendRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
  }

  const userId = req.user!.userId;
  const target = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!target) {
    return res.status(404).json({ error: "No user with that username" });
  }
  if (target.id === userId) {
    return res.status(400).json({ error: "You can't friend yourself" });
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: target.id },
        { requesterId: target.id, addresseeId: userId },
      ],
    },
  });
  if (existing) {
    return res
      .status(409)
      .json({ error: existing.status === "accepted" ? "You're already friends" : "A friend request already exists" });
  }

  const friendship = await prisma.friendship.create({
    data: { requesterId: userId, addresseeId: target.id },
  });

  res.status(201).json({ id: friendship.id, to: publicUser(target), createdAt: friendship.createdAt });
});

// Accept an incoming request.
friendsRouter.post("/requests/:id/accept", async (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const friendship = await prisma.friendship.findUnique({ where: { id: req.params.id } });

  if (!friendship || friendship.status !== "pending") {
    return res.status(404).json({ error: "No pending request found" });
  }
  if (friendship.addresseeId !== userId) {
    return res.status(403).json({ error: "Only the recipient can accept this request" });
  }

  const updated = await prisma.friendship.update({
    where: { id: friendship.id },
    data: { status: "accepted", respondedAt: new Date() },
    include: { requester: { select: { id: true, username: true } } },
  });

  res.json({ friendshipId: updated.id, friend: publicUser(updated.requester), since: updated.respondedAt });
});

// Decline a pending request, cancel one you sent, or unfriend an accepted friendship.
friendsRouter.delete("/requests/:id", async (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const friendship = await prisma.friendship.findUnique({ where: { id: req.params.id } });

  if (!friendship || (friendship.requesterId !== userId && friendship.addresseeId !== userId)) {
    return res.status(404).json({ error: "No friendship or request found" });
  }

  await prisma.friendship.delete({ where: { id: friendship.id } });
  res.status(204).send();
});
