import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CourseDetailScreen } from "../screens/CourseDetailScreen";
import { PlayScreen } from "../screens/PlayScreen";
import { colors } from "../theme";
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
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: "Course" }} />
      <Stack.Screen name="Play" component={PlayScreen} options={{ title: "Play" }} />
    </Stack.Navigator>
  );
}
