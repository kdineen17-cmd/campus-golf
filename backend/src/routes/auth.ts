import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/auth";

export const authRouter = Router();

// Loose protection against brute-force login guesses and registration
// spam. Note: this store is in-memory, so on Vercel it only holds within
// a warm function instance and resets on cold start — a real deterrent
// for casual abuse, not a airtight one. A durable store (e.g. Upstash
// Redis) would be the next step if this ever sees meaningful traffic.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  // The test suite runs many register/login calls through a single shared
  // app instance across the whole run, unrelated to this limiter's own
  // behavior — skip it there, except when a test is deliberately exercising
  // the limiter itself (see tests/auth.test.ts's "auth rate limiting" spec).
  skip: () => process.env.NODE_ENV === "test" && process.env.FORCE_RATE_LIMIT !== "1",
  message: { error: "Too many attempts. Please wait a few minutes and try again." },
});

const registerSchema = z.object({
  username: z.string().trim().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
});

authRouter.post("/register", authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    return res.status(409).json({ error: "Username or email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, passwordHash },
  });

  const token = signToken({ userId: user.id, username: user.username });
  res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

const loginSchema = z.object({
  usernameOrEmail: z.string().trim(),
  password: z.string(),
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const { usernameOrEmail, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: usernameOrEmail }, { email: usernameOrEmail.toLowerCase() }],
    },
  });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken({ userId: user.id, username: user.username });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});
