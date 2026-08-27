export interface LatLng {
  lat: number;
  lng: number;
}

export interface UserSummary {
  id: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: UserSummary & { email: string };
}

export interface CourseSummary {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  createdAt: string;
  creator: UserSummary;
  holeCount: number;
  totalPar: number;
  totalDistanceMeters: number;
  firstTee: LatLng | null;
}

export interface HoleDetail {
  id: string;
  index: number;
  name: string | null;
  par: number;
  tee: LatLng;
  hole: LatLng;
  distanceMeters: number;
  photo: string | null;
  flag: { x: number; y: number } | null;
}

export interface CourseDetail extends CourseSummary {
  holes: HoleDetail[];
}

export interface NewHoleInput {
  name?: string;
  par: number;
  tee: LatLng;
  hole: LatLng;
  photo?: string;
  flagX?: number;
  flagY?: number;
}

export interface NewCourseInput {
  name: string;
  description?: string;
  location?: string;
  holes: NewHoleInput[];
}

export interface UpdateCourseInput {
  name?: string;
  description?: string | null;
  location?: string | null;
}

export interface RoundResult {
  id: string;
  courseId: string;
  player: UserSummary;
  totalStrokes: number;
  durationSecs: number | null;
  completedAt: string;
  isCourseRecord: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  player: UserSummary;
  totalStrokes: number;
  durationSecs: number | null;
  completedAt: string;
}

export interface RoundHistoryEntry {
  id: string;
  course: { id: string; name: string; totalPar: number };
  totalStrokes: number;
  durationSecs: number | null;
  completedAt: string;
}

export interface Friend {
  friendshipId: string;
  friend: UserSummary;
  since: string;
  latestCourseAt: string | null;
  courseCount: number;
}

export interface IncomingFriendRequest {
  id: string;
  from: UserSummary;
  createdAt: string;
}

export interface OutgoingFriendRequest {
  id: string;
  to: UserSummary;
  createdAt: string;
}

export interface FriendRequests {
  incoming: IncomingFriendRequest[];
  outgoing: OutgoingFriendRequest[];
}

export interface UserProfile {
  user: UserSummary;
  roundsPlayed: number;
  coursesCreated: number;
  friendsCount: number;
  rounds: RoundHistoryEntry[];
  courses: CourseSummary[];
}
