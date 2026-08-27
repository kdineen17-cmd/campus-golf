import request from "supertest";
import { describe, expect, it } from "vitest";
import { app, befriend, createCourse, registerUser } from "./helpers";

describe("friend requests", () => {
  it("rejects without auth", async () => {
    const res = await request(app).get("/friends");
    expect(res.status).toBe(401);
  });

  it("sends, lists, and accepts a friend request", async () => {
    const a = await registerUser();
    const b = await registerUser();

    const sendRes = await request(app)
      .post("/friends/requests")
      .set("Authorization", `Bearer ${a.token}`)
      .send({ username: b.user.username });
    expect(sendRes.status).toBe(201);
    const requestId = sendRes.body.id as string;

    const bIncoming = await request(app).get("/friends/requests").set("Authorization", `Bearer ${b.token}`);
    expect(bIncoming.status).toBe(200);
    expect(bIncoming.body.incoming).toHaveLength(1);
    expect(bIncoming.body.incoming[0].from.username).toBe(a.user.username);

    const aOutgoing = await request(app).get("/friends/requests").set("Authorization", `Bearer ${a.token}`);
    expect(aOutgoing.body.outgoing).toHaveLength(1);
    expect(aOutgoing.body.outgoing[0].to.username).toBe(b.user.username);

    const acceptRes = await request(app)
      .post(`/friends/requests/${requestId}/accept`)
      .set("Authorization", `Bearer ${b.token}`);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.friend.username).toBe(a.user.username);

    const aFriends = await request(app).get("/friends").set("Authorization", `Bearer ${a.token}`);
    expect(aFriends.status).toBe(200);
    expect(aFriends.body).toHaveLength(1);
    expect(aFriends.body[0].friend.username).toBe(b.user.username);

    const bFriends = await request(app).get("/friends").set("Authorization", `Bearer ${b.token}`);
    expect(bFriends.body).toHaveLength(1);
    expect(bFriends.body[0].friend.username).toBe(a.user.username);
  });

  it("rejects sending a request to yourself", async () => {
    const a = await registerUser();
    const res = await request(app)
      .post("/friends/requests")
      .set("Authorization", `Bearer ${a.token}`)
      .send({ username: a.user.username });
    expect(res.status).toBe(400);
  });

  it("404s for an unknown username", async () => {
    const a = await registerUser();
    const res = await request(app)
      .post("/friends/requests")
      .set("Authorization", `Bearer ${a.token}`)
      .send({ username: "does-not-exist" });
    expect(res.status).toBe(404);
  });

  it("rejects a duplicate request", async () => {
    const a = await registerUser();
    const b = await registerUser();
    await request(app).post("/friends/requests").set("Authorization", `Bearer ${a.token}`).send({ username: b.user.username });
    const dupe = await request(app)
      .post("/friends/requests")
      .set("Authorization", `Bearer ${a.token}`)
      .send({ username: b.user.username });
    expect(dupe.status).toBe(409);
  });

  it("only lets the addressee accept a request", async () => {
    const a = await registerUser();
    const b = await registerUser();
    const sendRes = await request(app)
      .post("/friends/requests")
      .set("Authorization", `Bearer ${a.token}`)
      .send({ username: b.user.username });

    const res = await request(app)
      .post(`/friends/requests/${sendRes.body.id}/accept`)
      .set("Authorization", `Bearer ${a.token}`);
    expect(res.status).toBe(403);
  });

  it("lets the addressee decline a request", async () => {
    const a = await registerUser();
    const b = await registerUser();
    const sendRes = await request(app)
      .post("/friends/requests")
      .set("Authorization", `Bearer ${a.token}`)
      .send({ username: b.user.username });

    const declineRes = await request(app)
      .delete(`/friends/requests/${sendRes.body.id}`)
      .set("Authorization", `Bearer ${b.token}`);
    expect(declineRes.status).toBe(204);

    const bIncoming = await request(app).get("/friends/requests").set("Authorization", `Bearer ${b.token}`);
    expect(bIncoming.body.incoming).toHaveLength(0);

    // Declining clears the way for a fresh request between the same two users.
    const retryRes = await request(app)
      .post("/friends/requests")
      .set("Authorization", `Bearer ${a.token}`)
      .send({ username: b.user.username });
    expect(retryRes.status).toBe(201);
  });

  it("sorts friends by whoever has the newest course, no-course friends last", async () => {
    const me = await registerUser();
    const noCourses = await registerUser();
    const staleCourse = await registerUser();
    const freshCourse = await registerUser();

    await befriend(me.token, noCourses.user.username, noCourses.token);
    await befriend(me.token, staleCourse.user.username, staleCourse.token);
    await befriend(me.token, freshCourse.user.username, freshCourse.token);

    // Order of creation matters here since createdAt drives the sort.
    await createCourse(staleCourse.token, { name: "Stale Course" });
    await createCourse(freshCourse.token, { name: "Fresh Course" });

    const res = await request(app).get("/friends").set("Authorization", `Bearer ${me.token}`);
    expect(res.status).toBe(200);
    expect(res.body.map((f: { friend: { username: string } }) => f.friend.username)).toEqual([
      freshCourse.user.username,
      staleCourse.user.username,
      noCourses.user.username,
    ]);
    expect(res.body[0].courseCount).toBe(1);
    expect(res.body[2].latestCourseAt).toBeNull();
  });

  it("lets either side unfriend an accepted friendship", async () => {
    const a = await registerUser();
    const b = await registerUser();
    const sendRes = await request(app)
      .post("/friends/requests")
      .set("Authorization", `Bearer ${a.token}`)
      .send({ username: b.user.username });
    await request(app).post(`/friends/requests/${sendRes.body.id}/accept`).set("Authorization", `Bearer ${b.token}`);

    const unfriendRes = await request(app)
      .delete(`/friends/requests/${sendRes.body.id}`)
      .set("Authorization", `Bearer ${a.token}`);
    expect(unfriendRes.status).toBe(204);

    const aFriends = await request(app).get("/friends").set("Authorization", `Bearer ${a.token}`);
    expect(aFriends.body).toHaveLength(0);
    const bFriends = await request(app).get("/friends").set("Authorization", `Bearer ${b.token}`);
    expect(bFriends.body).toHaveLength(0);
  });
});
