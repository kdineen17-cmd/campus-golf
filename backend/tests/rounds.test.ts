import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app, createCourse, registerUser } from "./helpers";

describe("rounds and leaderboard", () => {
  let token: string;
  let holeIds: string[];
  let courseId: string;

  beforeAll(async () => {
    const auth = await registerUser();
    token = auth.token;
    const course = await createCourse(token);
    courseId = course.id;
    const detail = await request(app).get(`/courses/${courseId}`);
    holeIds = detail.body.holes.map((h: { id: string }) => h.id);
  });

  it("rejects a round submission without auth", async () => {
    const res = await request(app)
      .post(`/courses/${courseId}/rounds`)
      .send({ holes: holeIds.map((holeId) => ({ holeId, strokes: 4 })) });
    expect(res.status).toBe(401);
  });

  it("rejects a round that doesn't cover every hole", async () => {
    const res = await request(app)
      .post(`/courses/${courseId}/rounds`)
      .set("Authorization", `Bearer ${token}`)
      .send({ holes: [{ holeId: holeIds[0], strokes: 3 }] });
    expect(res.status).toBe(400);
  });

  it("submits a round and marks it as the course record when it's the first", async () => {
    const res = await request(app)
      .post(`/courses/${courseId}/rounds`)
      .set("Authorization", `Bearer ${token}`)
      .send({ durationSecs: 900, holes: holeIds.map((holeId) => ({ holeId, strokes: 4 })) });

    expect(res.status).toBe(201);
    expect(res.body.totalStrokes).toBe(8);
    expect(res.body.isCourseRecord).toBe(true);
  });

  it("ranks the leaderboard by lowest total strokes and dedupes to each player's best round", async () => {
    // The beforeAll'd `token` player already holds an 8-stroke round (2 holes x 4 strokes).
    const better = await registerUser();

    // A 6-stroke round beats the existing 8-stroke record...
    const firstRound = await request(app)
      .post(`/courses/${courseId}/rounds`)
      .set("Authorization", `Bearer ${better.token}`)
      .send({ holes: holeIds.map((holeId) => ({ holeId, strokes: 3 })) });
    expect(firstRound.body.isCourseRecord).toBe(true);

    // ...but a subsequent worse round from the same player should not be counted as their best.
    const secondRound = await request(app)
      .post(`/courses/${courseId}/rounds`)
      .set("Authorization", `Bearer ${better.token}`)
      .send({ holes: holeIds.map((holeId) => ({ holeId, strokes: 5 })) });
    expect(secondRound.body.isCourseRecord).toBe(false);

    const leaderboard = await request(app).get(`/courses/${courseId}/rounds/leaderboard`);
    expect(leaderboard.status).toBe(200);

    const entriesForBetterPlayer = leaderboard.body.filter(
      (e: { player: { id: string } }) => e.player.id === better.user.id
    );
    expect(entriesForBetterPlayer).toHaveLength(1);
    expect(entriesForBetterPlayer[0].totalStrokes).toBe(6);
    expect(leaderboard.body[0].player.id).toBe(better.user.id);
    expect(leaderboard.body[0].rank).toBe(1);
  });
});
