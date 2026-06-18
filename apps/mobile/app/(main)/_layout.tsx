import React from "react";
import { Tabs, useRouter } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/authStore";
import { Colors, Typography } from "../../utils/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(
  name: IoniconName,
  outlineName: IoniconName,
  focused: boolean
) {
  return (
    <Ionicons
      name={focused ? name : outlineName}
      size={24}
      color={focused ? Colors.peachDark : Colors.textMuted}
    />
  );
}

export default function MainLayout() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const { t } = useTranslation();

  if (!loading && !user) {
    router.replace("/(auth)/login");
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.peachDark,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: Typography.fontFamilyMedium,
          fontSize: 10,
          marginBottom: Platform.OS === "android" ? 4 : 0,
        },
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 24 : 8,
          paddingTop: 8,
          elevation: 12,
          shadowColor: Colors.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
        },
      }}
    >
      <Tabs.Screen
        name="feed/index"
        options={{
          title: t("feed_title"),
          tabBarIcon: ({ focused }) =>
            tabIcon("home", "home-outline", focused),
        }}
      />
      <Tabs.Screen
        name="journal/index"
        options={{
          title: t("journal_title"),
          tabBarIcon: ({ focused }) =>
            tabIcon("journal", "journal-outline", focused),
        }}
      />
      <Tabs.Screen
        name="toolbox/index"
        options={{
          title: "Toolbox",
          tabBarIcon: ({ focused }) =>
            tabIcon("heart", "heart-outline", focused),
        }}
      />
      <Tabs.Screen
        name="safety/index"
        options={{
          title: t("safety_title"),
          tabBarIcon: ({ focused }) =>
            tabIcon("shield-checkmark", "shield-checkmark-outline", focused),
        }}
      />
      <Tabs.Screen
        name="resources/index"
        options={{
          title: t("resources_title"),
          tabBarIcon: ({ focused }) =>
            tabIcon("library", "library-outline", focused),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: t("profile_title"),
          tabBarIcon: ({ focused }) =>
            tabIcon("person-circle", "person-circle-outline", focused),
        }}
      />

      {/* Sub-screens — hidden from the tab bar */}
      <Tabs.Screen name="journal/insights" options={{ href: null }} />
      <Tabs.Screen name="explore/index"    options={{ href: null }} />
      <Tabs.Screen name="explore/[id]"     options={{ href: null }} />
      <Tabs.Screen name="feed/[id]"        options={{ href: null }} />
      <Tabs.Screen name="feed/create"      options={{ href: null }} />
      <Tabs.Screen name="messages/index"   options={{ href: null }} />
      <Tabs.Screen name="messages/[id]"    options={{ href: null }} />
      <Tabs.Screen name="tracker/index"    options={{ href: null }} />
      <Tabs.Screen name="resources/[id]"     options={{ href: null }} />
      <Tabs.Screen name="resources/events"   options={{ href: null }} />
      <Tabs.Screen name="profile/edit"        options={{ href: null }} />
      <Tabs.Screen name="profile/settings"   options={{ href: null }} />
      <Tabs.Screen name="notifications/index" options={{ href: null }} />
      <Tabs.Screen name="search/index"        options={{ href: null }} />
    </Tabs>
  );
}
