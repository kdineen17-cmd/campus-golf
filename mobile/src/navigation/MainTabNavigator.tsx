import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { CourseListScreen } from "../screens/CourseListScreen";
import { CreateCourseScreen } from "../screens/CreateCourseScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { colors, fonts } from "../theme";
import { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.fairway,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts.serifBold, fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="CoursesTab"
        component={CourseListScreen}
        options={{ title: "Courses", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⛳</Text> }}
      />
      <Tab.Screen
        name="CreateTab"
        component={CreateCourseScreen}
        options={{ title: "Create", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📍</Text> }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: "Profile", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏌️</Text> }}
      />
    </Tab.Navigator>
  );
}
