import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../lib/auth";

export const roundsRouter = Router({ mergeParams: true });

function courseIdParam(req: { params: Record<string, string> }): string {
  return req.params.courseId;
}

const submitRoundSchema = z.object({
  durationSecs: z.number().int().min(0).optional(),
  holes: z
    .array(
      z.object({
        holeId: z.string(),
        strokes: z.number().int().min(1).max(30),
      })
    )
    .min(1),
});

// Submit a completed round for a course.
roundsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const courseId = courseIdParam(req);
  const parsed = submitRoundSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { durationSecs, holes } = parsed.data;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { holes: true },
  });
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  const validHoleIds = new Set(course.holes.map((h) => h.id));
  if (holes.length !== course.holes.length || holes.some((h) => !validHoleIds.has(h.holeId))) {
    return res.status(400).json({ error: "Round must include exactly one score per course hole" });
  }

  const totalStrokes = holes.reduce((sum, h) => sum + h.strokes, 0);
  const userId = req.user!.userId;

  const priorBest = await prisma.round.aggregate({
    where: { courseId },
    _min: { totalStrokes: true },
  });

  const round = await prisma.round.create({
    data: {
      courseId,
      playerId: userId,
      totalStrokes,
      durationSecs,
      roundHoles: {
        create: holes.map((h) => ({ holeId: h.holeId, strokes: h.strokes })),
      },
    },
    include: { player: { select: { id: true, username: true } } },
  });

  const isCourseRecord =
    priorBest._min.totalStrokes === null || totalStrokes < priorBest._min.totalStrokes;

  res.status(201).json({
    id: round.id,
    courseId: round.courseId,
    player: round.player,
    totalStrokes: round.totalStrokes,
    durationSecs: round.durationSecs,
    completedAt: round.completedAt,
    isCourseRecord,
  });
});

// Leaderboard: each player's best round on this course, lowest strokes first.
roundsRouter.get("/leaderboard", async (req, res) => {
  const courseId = courseIdParam(req);

  const rounds = await prisma.round.findMany({
    where: { courseId },
    orderBy: [{ totalStrokes: "asc" }, { completedAt: "asc" }],
    include: { player: { select: { id: true, username: true } } },
  });

  const bestByPlayer = new Map<string, (typeof rounds)[number]>();
  for (const round of rounds) {
    if (!bestByPlayer.has(round.playerId)) {
      bestByPlayer.set(round.playerId, round);
    }
  }

  const leaderboard = Array.from(bestByPlayer.values())
    .sort((a, b) => a.totalStrokes - b.totalStrokes)
    .slice(0, 50)
    .map((round, index) => ({
      rank: index + 1,
      player: round.player,
      totalStrokes: round.totalStrokes,
      durationSecs: round.durationSecs,
      completedAt: round.completedAt,
    }));

  res.json(leaderboard);
});
