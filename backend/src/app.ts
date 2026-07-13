import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { coursesRouter } from "./routes/courses";
import { roundsRouter } from "./routes/rounds";
import { usersRouter } from "./routes/users";

export function createApp() {
  const app = express();

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
