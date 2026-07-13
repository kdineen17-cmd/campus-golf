import request from "supertest";
import { describe, expect, it } from "vitest";
import { app, createCourse, registerUser } from "./helpers";

describe("round history", () => {
  it("rejects fetching round history without auth", async () => {
    const res = await request(app).get("/users/me/rounds");
    expect(res.status).toBe(401);
  });

  it("returns the signed-in user's rounds, most recent first", async () => {
    const { token } = await registerUser();
    const courseA = await createCourse(token, { name: "History Course A" });
    const courseB = await createCourse(token, { name: "History Course B" });

    for (const courseId of [courseA.id, courseB.id]) {
      const detail = await request(app).get(`/courses/${courseId}`);
      await request(app)
        .post(`/courses/${courseId}/rounds`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          holes: detail.body.holes.map((h: { id: string }) => ({ holeId: h.id, strokes: 4 })),
        });
    }

    const res = await request(app).get("/users/me/rounds").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].course.name).toBe("History Course B");
    expect(res.body.every((r: { totalStrokes: number }) => r.totalStrokes === 8)).toBe(true);
  });
});
