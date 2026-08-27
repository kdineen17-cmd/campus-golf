import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./helpers";

describe("privacy policy", () => {
  it("serves the privacy policy page", async () => {
    const res = await request(app).get("/privacy");
    expect(res.status).toBe(200);
    expect(res.type).toBe("text/html");
    expect(res.text).toContain("Privacy Policy");
    expect(res.text).toContain("Delete my account");
  });
});
