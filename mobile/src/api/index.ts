import { apiRequest } from "./client";
import {
  AuthResponse,
  CourseDetail,
  CourseSummary,
  Friend,
  FriendRequests,
  LeaderboardEntry,
  NewCourseInput,
  NewHoleInput,
  OutgoingFriendRequest,
  RoundHistoryEntry,
  RoundResult,
  UpdateCourseInput,
  UserProfile,
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

  listCourses(creatorId?: string) {
    const query = creatorId ? `?creatorId=${encodeURIComponent(creatorId)}` : "";
    return apiRequest<CourseSummary[]>(`/courses${query}`);
  },

  getCourse(courseId: string) {
    return apiRequest<CourseDetail>(`/courses/${courseId}`);
  },

  createCourse(input: NewCourseInput, token: string) {
    return apiRequest<CourseSummary>("/courses", { method: "POST", body: input, token });
  },

  updateCourse(courseId: string, input: UpdateCourseInput, token: string) {
    return apiRequest<CourseDetail>(`/courses/${courseId}`, { method: "PATCH", body: input, token });
  },

  addHole(courseId: string, input: NewHoleInput, token: string) {
    return apiRequest<CourseDetail>(`/courses/${courseId}/holes`, { method: "POST", body: input, token });
  },

  deleteCourse(courseId: string, token: string) {
    return apiRequest<void>(`/courses/${courseId}`, { method: "DELETE", token });
  },

  getMyRounds(token: string) {
    return apiRequest<RoundHistoryEntry[]>("/users/me/rounds", { token });
  },

  getMyCourses(token: string) {
    return apiRequest<CourseSummary[]>("/users/me/courses", { token });
  },

  deleteAccount(token: string) {
    return apiRequest<void>("/users/me", { method: "DELETE", token });
  },

  getLeaderboard(courseId: string) {
    return apiRequest<LeaderboardEntry[]>(`/courses/${courseId}/rounds/leaderboard`);
  },

  getFriends(token: string) {
    return apiRequest<Friend[]>("/friends", { token });
  },

  getFriendRequests(token: string) {
    return apiRequest<FriendRequests>("/friends/requests", { token });
  },

  sendFriendRequest(username: string, token: string) {
    return apiRequest<OutgoingFriendRequest>("/friends/requests", { method: "POST", body: { username }, token });
  },

  acceptFriendRequest(requestId: string, token: string) {
    return apiRequest<Friend>(`/friends/requests/${requestId}/accept`, { method: "POST", token });
  },

  removeFriendship(friendshipOrRequestId: string, token: string) {
    return apiRequest<void>(`/friends/requests/${friendshipOrRequestId}`, { method: "DELETE", token });
  },

  getUserProfile(userId: string, token: string) {
    return apiRequest<UserProfile>(`/users/${userId}/profile`, { token });
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
