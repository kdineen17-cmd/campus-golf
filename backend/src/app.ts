import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { coursesRouter } from "./routes/courses";
import { roundsRouter } from "./routes/rounds";
import { usersRouter } from "./routes/users";
import { privacyRouter } from "./routes/privacy";

export function createApp() {
  const app = express();

  // Trust Vercel's edge proxy so req.ip reflects the real client address
  // (from X-Forwarded-For) rather than the proxy's own address — required
  // for per-client rate limiting to actually be per-client.
  app.set("trust proxy", 1);

  app.use(cors());
  // Default express.json() body limit (100kb) is too small for a hole's
  // base64-encoded tee-box photo; 4mb comfortably covers the ~3mb cap
  // enforced in the hole schema while staying under Vercel's ~4.5mb
  // request body ceiling.
  app.use(express.json({ limit: "4mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/privacy", privacyRouter);

  app.use("/auth", authRouter);
  app.use("/courses", coursesRouter);
  app.use("/courses/:courseId/rounds", roundsRouter);
  app.use("/users", usersRouter);

  app.use((req, res) => {
    res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
  });

  return app;
}
