import request from "supertest";
import { describe, expect, it } from "vitest";
import { app, befriend, createCourse, registerUser } from "./helpers";

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

describe("account deletion", () => {
  it("rejects deleting without auth", async () => {
    const res = await request(app).delete("/users/me");
    expect(res.status).toBe(401);
  });

  it("deletes the account and cascades to owned courses and played rounds", async () => {
    const { token, user } = await registerUser();
    const other = await registerUser();

    // A course they created.
    const ownCourse = await createCourse(token, { name: "Deletion Test Course" });
    // A round they played on someone else's course.
    const othersCourse = await createCourse(other.token, { name: "Someone Else's Course" });
    const detail = await request(app).get(`/courses/${othersCourse.id}`);
    await request(app)
      .post(`/courses/${othersCourse.id}/rounds`)
      .set("Authorization", `Bearer ${token}`)
      .send({ holes: detail.body.holes.map((h: { id: string }) => ({ holeId: h.id, strokes: 4 })) });

    const res = await request(app).delete("/users/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);

    // Their own course is gone.
    const ownCourseAfter = await request(app).get(`/courses/${ownCourse.id}`);
    expect(ownCourseAfter.status).toBe(404);

    // The other user's course survives, but the deleted user's round on it is gone.
    const leaderboard = await request(app).get(`/courses/${othersCourse.id}/rounds/leaderboard`);
    expect(leaderboard.status).toBe(200);
    expect(leaderboard.body.some((entry: { player: { id: string } }) => entry.player.id === user.id)).toBe(false);
  });
});

describe("user profile", () => {
  it("rejects fetching a profile without auth", async () => {
    const { user } = await registerUser();
    const res = await request(app).get(`/users/${user.id}/profile`);
    expect(res.status).toBe(401);
  });

  it("returns your own profile with stats, rounds, and courses", async () => {
    const { token, user } = await registerUser();
    const course = await createCourse(token, { name: "My Own Course" });
    const detail = await request(app).get(`/courses/${course.id}`);
    await request(app)
      .post(`/courses/${course.id}/rounds`)
      .set("Authorization", `Bearer ${token}`)
      .send({ holes: detail.body.holes.map((h: { id: string }) => ({ holeId: h.id, strokes: 4 })) });

    const res = await request(app).get(`/users/${user.id}/profile`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(user.username);
    expect(res.body.roundsPlayed).toBe(1);
    expect(res.body.coursesCreated).toBe(1);
    expect(res.body.friendsCount).toBe(0);
    expect(res.body.courses[0].name).toBe("My Own Course");
    expect(res.body.rounds[0].totalStrokes).toBe(8);
  });

  it("lets a friend view the profile", async () => {
    const a = await registerUser();
    const b = await registerUser();
    await befriend(a.token, b.user.username, b.token);

    const res = await request(app).get(`/users/${b.user.id}/profile`).set("Authorization", `Bearer ${a.token}`);
    expect(res.status).toBe(200);
    expect(res.body.friendsCount).toBe(1);
  });

  it("blocks a non-friend from viewing the profile", async () => {
    const a = await registerUser();
    const b = await registerUser();

    const res = await request(app).get(`/users/${b.user.id}/profile`).set("Authorization", `Bearer ${a.token}`);
    expect(res.status).toBe(403);
  });

  it("404s for an unknown user id", async () => {
    const { token } = await registerUser();
    const res = await request(app).get("/users/does-not-exist/profile").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe("my courses", () => {
  it("rejects fetching my courses without auth", async () => {
    const res = await request(app).get("/users/me/courses");
    expect(res.status).toBe(401);
  });

  it("returns only courses created by the signed-in user", async () => {
    const { token } = await registerUser();
    const other = await registerUser();

    await createCourse(token, { name: "Mine A" });
    await createCourse(token, { name: "Mine B" });
    await createCourse(other.token, { name: "Not Mine" });

    const res = await request(app).get("/users/me/courses").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((c: { name: string }) => c.name).sort()).toEqual(["Mine A", "Mine B"]);
  });
});
