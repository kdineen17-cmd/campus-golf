import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app, createCourse, registerUser } from "./helpers";

describe("courses", () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const auth = await registerUser();
    token = auth.token;
    userId = auth.user.id;
  });

  it("creates a course with holes and computes distance/par totals", async () => {
    const res = await request(app)
      .post("/courses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Riverside Park 9",
        location: "Riverside Park",
        holes: [
          { name: "The Old Oak", par: 3, tee: { lat: 40.7829, lng: -73.9654 }, hole: { lat: 40.7834, lng: -73.9648 } },
          { name: "Duck Pond", par: 4, tee: { lat: 40.7834, lng: -73.9648 }, hole: { lat: 40.7841, lng: -73.9639 } },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.holeCount).toBe(2);
    expect(res.body.totalPar).toBe(7);
    expect(res.body.totalDistanceMeters).toBeGreaterThan(0);
    expect(res.body.firstTee).toEqual({ lat: 40.7829, lng: -73.9654 });
    expect(res.body.creator.id).toBe(userId);
  });

  it("rejects course creation without auth", async () => {
    const res = await request(app)
      .post("/courses")
      .send({ name: "No Auth Course", holes: [{ par: 3, tee: { lat: 0, lng: 0 }, hole: { lat: 0.001, lng: 0.001 } }] });
    expect(res.status).toBe(401);
  });

  it("rejects a course with no holes", async () => {
    const res = await request(app)
      .post("/courses")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Empty Course", holes: [] });
    expect(res.status).toBe(400);
  });

  it("lists courses including the new one", async () => {
    const course = await createCourse(token);
    const res = await request(app).get("/courses");
    expect(res.status).toBe(200);
    expect(res.body.some((c: { id: string }) => c.id === course.id)).toBe(true);
  });

  it("gets full hole detail for a course", async () => {
    const course = await createCourse(token);
    const res = await request(app).get(`/courses/${course.id}`);
    expect(res.status).toBe(200);
    expect(res.body.holes).toHaveLength(2);
    expect(res.body.holes[0].index).toBe(0);
    expect(res.body.holes[0].distanceMeters).toBeGreaterThan(0);
  });

  it("404s for an unknown course id", async () => {
    const res = await request(app).get("/courses/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("lets the creator edit course metadata", async () => {
    const course = await createCourse(token, { name: "Original Name" });
    const res = await request(app)
      .patch(`/courses/${course.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Name", location: "New Location" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Name");
    expect(res.body.location).toBe("New Location");
  });

  it("forbids a non-creator from editing course metadata", async () => {
    const course = await createCourse(token);
    const other = await registerUser();
    const res = await request(app)
      .patch(`/courses/${course.id}`)
      .set("Authorization", `Bearer ${other.token}`)
      .send({ name: "Hijacked Name" });

    expect(res.status).toBe(403);
  });

  it("lets the creator append a new hole", async () => {
    const course = await createCourse(token);
    const res = await request(app)
      .post(`/courses/${course.id}/holes`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Bonus Hole", par: 5, tee: { lat: 40.01, lng: -73.01 }, hole: { lat: 40.011, lng: -73.011 } });

    expect(res.status).toBe(201);
    expect(res.body.holeCount).toBe(3);
    expect(res.body.holes[2].index).toBe(2);
    expect(res.body.holes[2].name).toBe("Bonus Hole");
  });

  it("forbids a non-creator from appending a hole", async () => {
    const course = await createCourse(token);
    const other = await registerUser();
    const res = await request(app)
      .post(`/courses/${course.id}/holes`)
      .set("Authorization", `Bearer ${other.token}`)
      .send({ par: 3, tee: { lat: 0, lng: 0 }, hole: { lat: 0.001, lng: 0.001 } });

    expect(res.status).toBe(403);
  });

  it("forbids a non-creator from deleting a course, allows the creator", async () => {
    const course = await createCourse(token);
    const other = await registerUser();

    const denied = await request(app).delete(`/courses/${course.id}`).set("Authorization", `Bearer ${other.token}`);
    expect(denied.status).toBe(403);

    const allowed = await request(app).delete(`/courses/${course.id}`).set("Authorization", `Bearer ${token}`);
    expect(allowed.status).toBe(204);

    const fetched = await request(app).get(`/courses/${course.id}`);
    expect(fetched.status).toBe(404);
  });

  it("cascades deletion cleanly even when the course has rounds", async () => {
    const course = await createCourse(token);
    const detail = await request(app).get(`/courses/${course.id}`);

    await request(app)
      .post(`/courses/${course.id}/rounds`)
      .set("Authorization", `Bearer ${token}`)
      .send({ holes: detail.body.holes.map((h: { id: string }, i: number) => ({ holeId: h.id, strokes: i + 3 })) });

    const deleted = await request(app).delete(`/courses/${course.id}`).set("Authorization", `Bearer ${token}`);
    expect(deleted.status).toBe(204);
  });
});
