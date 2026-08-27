import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AddHoleScreen } from "../screens/AddHoleScreen";
import { CourseDetailScreen } from "../screens/CourseDetailScreen";
import { EditCourseScreen } from "../screens/EditCourseScreen";
import { FriendProfileScreen } from "../screens/FriendProfileScreen";
import { MyQrCodeScreen } from "../screens/MyQrCodeScreen";
import { PlayScreen } from "../screens/PlayScreen";
import { RulesScreen } from "../screens/RulesScreen";
import { ScanQrScreen } from "../screens/ScanQrScreen";
import { colors, fonts } from "../theme";
import { MainTabNavigator } from "./MainTabNavigator";
import { AppStackParamList } from "./types";

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.fairwayDark,
        headerStyle: { backgroundColor: colors.sky },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 18 },
        headerBackTitleStyle: { fontFamily: fonts.serif },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: "Course" }} />
      <Stack.Screen name="Play" component={PlayScreen} options={{ title: "Play" }} />
      <Stack.Screen name="AddHole" component={AddHoleScreen} options={{ title: "Add a hole" }} />
      <Stack.Screen name="EditCourse" component={EditCourseScreen} options={{ title: "Edit course" }} />
      <Stack.Screen name="Rules" component={RulesScreen} options={{ title: "Official Rules" }} />
      <Stack.Screen name="FriendProfile" component={FriendProfileScreen} />
      <Stack.Screen name="MyQrCode" component={MyQrCodeScreen} options={{ title: "My QR Code" }} />
      <Stack.Screen name="ScanQr" component={ScanQrScreen} options={{ title: "Scan a QR Code" }} />
    </Stack.Navigator>
  );
}
