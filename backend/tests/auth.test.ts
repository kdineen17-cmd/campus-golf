import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { app, registerUser } from "./helpers";

describe("auth", () => {
  it("registers a new user and returns a token", async () => {
    const suffix = randomUUID().slice(0, 8);
    const res = await request(app)
      .post("/auth/register")
      .send({ username: `newuser_${suffix}`, email: `newuser_${suffix}@example.com`, password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.username).toBe(`newuser_${suffix}`);
  });

  it("rejects a duplicate username or email", async () => {
    const { user } = await registerUser();
    const res = await request(app)
      .post("/auth/register")
      .send({ username: user.username, email: `different_${user.username}@example.com`, password: "password123" });

    expect(res.status).toBe(409);
  });

  it("rejects invalid registration input", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ username: "ab", email: "not-an-email", password: "short" });

    expect(res.status).toBe(400);
  });

  it("logs in with correct credentials", async () => {
    const { user } = await registerUser({ password: "correct-horse" });
    const res = await request(app)
      .post("/auth/login")
      .send({ usernameOrEmail: user.username, password: "correct-horse" });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("rejects an incorrect password", async () => {
    const { user } = await registerUser({ password: "correct-horse" });
    const res = await request(app)
      .post("/auth/login")
      .send({ usernameOrEmail: user.username, password: "wrong-password" });

    expect(res.status).toBe(401);
  });
});

describe("auth rate limiting", () => {
  it("blocks further login/register attempts from the same client after the limit is hit", async () => {
    // The limiter is skipped in the test environment by default (see
    // src/routes/auth.ts) so the rest of the suite's register/login calls
    // through the shared app don't trip it. Force it on for this one
    // isolated app instance to actually exercise the limiter's behavior.
    process.env.FORCE_RATE_LIMIT = "1";
    try {
      const isolatedApp = createApp();
      const suffix = randomUUID().slice(0, 8);

      let lastStatus = 0;
      for (let i = 0; i < 31; i++) {
        const res = await request(isolatedApp)
          .post("/auth/login")
          .send({ usernameOrEmail: `nobody_${suffix}`, password: "wrong" });
        lastStatus = res.status;
      }

      expect(lastStatus).toBe(429);
    } finally {
      delete process.env.FORCE_RATE_LIMIT;
    }
  });
});

describe("requireAuth token sources", () => {
  it("accepts a token passed as an access_token query param when no Authorization header is sent", async () => {
    const { token } = await registerUser();
    const res = await request(app).get(`/users/me/courses?access_token=${token}`);
    expect(res.status).toBe(200);
  });

  it("still rejects when neither the header nor the query param carry a token", async () => {
    const res = await request(app).get("/users/me/courses");
    expect(res.status).toBe(401);
  });
});
