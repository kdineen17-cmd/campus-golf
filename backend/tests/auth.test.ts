import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
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
