import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { coursesRouter } from "./routes/courses";
import { roundsRouter } from "./routes/rounds";
import { usersRouter } from "./routes/users";

export function createApp() {
  const app = express();

  // Trust Vercel's edge proxy so req.ip reflects the real client address
  // (from X-Forwarded-For) rather than the proxy's own address — required
  // for per-client rate limiting to actually be per-client.
  app.set("trust proxy", 1);

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRouter);
  app.use("/courses", coursesRouter);
  app.use("/courses/:courseId/rounds", roundsRouter);
  app.use("/users", usersRouter);

  app.use((req, res) => {
    res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
  });

  return app;
}
