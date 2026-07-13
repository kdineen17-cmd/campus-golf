import { randomUUID } from "node:crypto";
import request from "supertest";
import { createApp } from "../src/app";

export const app = createApp();

export async function registerUser(overrides: Partial<{ username: string; email: string; password: string }> = {}) {
  const suffix = randomUUID().slice(0, 8);
  const username = overrides.username ?? `player_${suffix}`;
  const email = overrides.email ?? `${username}@example.com`;
  const password = overrides.password ?? "password123";

  const res = await request(app).post("/auth/register").send({ username, email, password });
  if (res.status !== 201) {
    throw new Error(`registerUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.token as string, user: res.body.user as { id: string; username: string; email: string } };
}

export async function createCourse(
  token: string,
  overrides: Partial<{ name: string; description: string; location: string; holes: unknown[] }> = {}
) {
  const suffix = randomUUID().slice(0, 8);
  const body = {
    name: overrides.name ?? `Test Course ${suffix}`,
    description: overrides.description,
    location: overrides.location,
    holes: overrides.holes ?? [
      { name: "Hole 1", par: 3, tee: { lat: 40.0, lng: -73.0 }, hole: { lat: 40.001, lng: -73.001 } },
      { name: "Hole 2", par: 4, tee: { lat: 40.001, lng: -73.001 }, hole: { lat: 40.002, lng: -73.002 } },
    ],
  };
  const res = await request(app).post("/courses").set("Authorization", `Bearer ${token}`).send(body);
  if (res.status !== 201) {
    throw new Error(`createCourse failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body as { id: string; name: string };
}
