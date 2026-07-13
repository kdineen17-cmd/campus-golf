export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  CoursesTab: undefined;
  CreateTab: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  CourseDetail: { courseId: string };
  Play: { courseId: string };
};
