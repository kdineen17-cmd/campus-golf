import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../lib/auth";
import { haversineMeters } from "../lib/geo";

export const coursesRouter = Router();

const latLng = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const holeSchema = z.object({
  name: z.string().trim().max(60).optional(),
  par: z.number().int().min(1).max(15),
  tee: latLng,
  hole: latLng,
});

const createCourseSchema = z.object({
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().max(500).optional(),
  location: z.string().trim().max(120).optional(),
  holes: z.array(holeSchema).min(1).max(36),
});

export interface HoleRow {
  id: string;
  index: number;
  name: string | null;
  par: number;
  teeLat: number;
  teeLng: number;
  holeLat: number;
  holeLng: number;
}

export interface CourseRow {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  createdAt: Date;
  creator: { id: string; username: string };
  holes: HoleRow[];
}

export function courseSummary(course: CourseRow) {
  const totalPar = course.holes.reduce((sum, h) => sum + h.par, 0);
  const totalDistanceMeters = course.holes.reduce(
    (sum, h) => sum + haversineMeters(h.teeLat, h.teeLng, h.holeLat, h.holeLng),
    0
  );
  const firstTee = course.holes.find((h) => h.index === 0) ?? course.holes[0];
  return {
    id: course.id,
    name: course.name,
    description: course.description,
    location: course.location,
    createdAt: course.createdAt,
    creator: course.creator,
    holeCount: course.holes.length,
    totalPar,
    totalDistanceMeters: Math.round(totalDistanceMeters),
    firstTee: firstTee ? { lat: firstTee.teeLat, lng: firstTee.teeLng } : null,
  };
}

// List all courses (most recent first).
coursesRouter.get("/", async (_req, res) => {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { creator: { select: { id: true, username: true } }, holes: true },
  });
  res.json(courses.map(courseSummary));
});

// Create a new course with holes.
coursesRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createCourseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { name, description, location, holes } = parsed.data;
  const userId = req.user!.userId;

  const course = await prisma.course.create({
    data: {
      name,
      description,
      location,
      creatorId: userId,
      holes: {
        create: holes.map((h, index) => ({
          index,
          name: h.name,
          par: h.par,
          teeLat: h.tee.lat,
          teeLng: h.tee.lng,
          holeLat: h.hole.lat,
          holeLng: h.hole.lng,
        })),
      },
    },
    include: { creator: { select: { id: true, username: true } }, holes: true },
  });

  res.status(201).json(courseSummary(course));
});

function courseDetail(course: CourseRow) {
  const holes = course.holes.map((h) => ({
    id: h.id,
    index: h.index,
    name: h.name,
    par: h.par,
    tee: { lat: h.teeLat, lng: h.teeLng },
    hole: { lat: h.holeLat, lng: h.holeLng },
    distanceMeters: Math.round(haversineMeters(h.teeLat, h.teeLng, h.holeLat, h.holeLng)),
  }));
  return { ...courseSummary(course), holes };
}

// Get a single course with full hole detail.
coursesRouter.get("/:id", async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: {
      creator: { select: { id: true, username: true } },
      holes: { orderBy: { index: "asc" } },
    },
  });
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  res.json(courseDetail(course));
});

const updateCourseSchema = z.object({
  name: z.string().trim().min(3).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  location: z.string().trim().max(120).nullable().optional(),
});

// Edit a course's name/description/location. Only its creator may edit it.
coursesRouter.patch("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = updateCourseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  const existing = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    return res.status(404).json({ error: "Course not found" });
  }
  if (existing.creatorId !== req.user!.userId) {
    return res.status(403).json({ error: "Only the course creator can edit this course" });
  }

  const course = await prisma.course.update({
    where: { id: existing.id },
    data: parsed.data,
    include: {
      creator: { select: { id: true, username: true } },
      holes: { orderBy: { index: "asc" } },
    },
  });

  res.json(courseDetail(course));
});

// Append a new hole to the end of a course. Only its creator may add holes.
coursesRouter.post("/:id/holes", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = holeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  const existing = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: { holes: true },
  });
  if (!existing) {
    return res.status(404).json({ error: "Course not found" });
  }
  if (existing.creatorId !== req.user!.userId) {
    return res.status(403).json({ error: "Only the course creator can add holes" });
  }
  if (existing.holes.length >= 36) {
    return res.status(400).json({ error: "A course can have at most 36 holes" });
  }

  const h = parsed.data;
  await prisma.hole.create({
    data: {
      courseId: existing.id,
      index: existing.holes.length,
      name: h.name,
      par: h.par,
      teeLat: h.tee.lat,
      teeLng: h.tee.lng,
      holeLat: h.hole.lat,
      holeLng: h.hole.lng,
    },
  });

  const course = await prisma.course.findUniqueOrThrow({
    where: { id: existing.id },
    include: {
      creator: { select: { id: true, username: true } },
      holes: { orderBy: { index: "asc" } },
    },
  });

  res.status(201).json(courseDetail(course));
});

// Delete a course. Only its creator may delete it.
coursesRouter.delete("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }
  if (course.creatorId !== req.user!.userId) {
    return res.status(403).json({ error: "Only the course creator can delete this course" });
  }

  await prisma.course.delete({ where: { id: course.id } });
  res.status(204).send();
});
