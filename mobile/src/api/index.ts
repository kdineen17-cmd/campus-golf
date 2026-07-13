import { apiRequest } from "./client";
import {
  AuthResponse,
  CourseDetail,
  CourseSummary,
  LeaderboardEntry,
  NewCourseInput,
  RoundResult,
} from "./types";

export const api = {
  register(username: string, email: string, password: string) {
    return apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: { username, email, password },
    });
  },

  login(usernameOrEmail: string, password: string) {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: { usernameOrEmail, password },
    });
  },

  listCourses() {
    return apiRequest<CourseSummary[]>("/courses");
  },

  getCourse(courseId: string) {
    return apiRequest<CourseDetail>(`/courses/${courseId}`);
  },

  createCourse(input: NewCourseInput, token: string) {
    return apiRequest<CourseSummary>("/courses", { method: "POST", body: input, token });
  },

  getLeaderboard(courseId: string) {
    return apiRequest<LeaderboardEntry[]>(`/courses/${courseId}/rounds/leaderboard`);
  },

  submitRound(
    courseId: string,
    input: { durationSecs?: number; holes: { holeId: string; strokes: number }[] },
    token: string
  ) {
    return apiRequest<RoundResult>(`/courses/${courseId}/rounds`, {
      method: "POST",
      body: input,
      token,
    });
  },
};

export * from "./types";
export { ApiError } from "./client";
