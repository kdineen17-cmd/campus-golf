import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
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
        options={{
          title: "Courses",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "flag" : "flag-outline"} size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CreateTab"
        component={CreateCourseScreen}
        options={{
          title: "Create",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "add-circle" : "add-circle-outline"} size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={20} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
