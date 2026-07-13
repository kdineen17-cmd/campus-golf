export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  CoursesTab: undefined;
  CreateTab: undefined;
  ProfileTab: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  CourseDetail: { courseId: string };
  Play: { courseId: string };
  AddHole: { courseId: string };
  EditCourse: { courseId: string };
  Rules: undefined;
};
