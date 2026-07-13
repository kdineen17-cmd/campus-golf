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

function courseSummary(course: {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  createdAt: Date;
  creator: { id: string; username: string };
  holes: { par: number; teeLat: number; teeLng: number; holeLat: number; holeLng: number }[];
}) {
  const totalPar = course.holes.reduce((sum, h) => sum + h.par, 0);
  const totalDistanceMeters = course.holes.reduce(
    (sum, h) => sum + haversineMeters(h.teeLat, h.teeLng, h.holeLat, h.holeLng),
    0
  );
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

  const holes = course.holes.map((h) => ({
    id: h.id,
    index: h.index,
    name: h.name,
    par: h.par,
    tee: { lat: h.teeLat, lng: h.teeLng },
    hole: { lat: h.holeLat, lng: h.holeLng },
    distanceMeters: Math.round(haversineMeters(h.teeLat, h.teeLng, h.holeLat, h.holeLng)),
  }));

  res.json({ ...courseSummary(course), holes });
});
