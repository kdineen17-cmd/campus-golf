export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  CoursesTab: undefined;
  CreateTab: undefined;
  FriendsTab: undefined;
  ProfileTab: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  CourseDetail: { courseId: string };
  Play: { courseId: string };
  RoundDetail: { courseId: string; roundId: string };
  AddHole: { courseId: string };
  EditCourse: { courseId: string };
  Rules: undefined;
  FriendProfile: { userId: string; username: string };
  MyQrCode: undefined;
  ScanQr: undefined;
};
