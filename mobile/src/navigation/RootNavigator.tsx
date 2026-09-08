import { LinkingOptions, NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import { AppNavigator } from "./AppNavigator";
import { AuthNavigator } from "./AuthNavigator";
import { AppStackParamList } from "./types";

// campusgolf:// deep links (shared via Share course/Share my profile). Only
// resolves when the recipient already has the app installed and is signed
// in -- there's no web fallback page, and the linked screens only exist in
// AppNavigator's tree, so a link opened while logged out is a no-op.
const linking: LinkingOptions<AppStackParamList> = {
  prefixes: ["campusgolf://"],
  config: {
    screens: {
      MainTabs: {
        screens: {
          CoursesTab: "courses",
          CreateTab: "create",
          FriendsTab: "friends",
          ProfileTab: "profile",
        },
      },
      CourseDetail: "course/:courseId",
      RoundDetail: "course/:courseId/round/:roundId",
      FriendProfile: "user/:userId/:username",
      Play: "play/:courseId",
      AddHole: "add-hole/:courseId",
      EditCourse: "edit-course/:courseId",
      Rules: "rules",
      MyQrCode: "my-qr",
      ScanQr: "scan",
    },
  },
};

export function RootNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.sky }}>
        <ActivityIndicator color={colors.fairway} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>{token ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>
  );
}
