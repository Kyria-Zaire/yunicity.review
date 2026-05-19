import { feedTheme } from "@/components/feed/feed-theme";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: {
          backgroundColor: feedTheme.bg,
          borderTopColor: feedTheme.border,
        },
        tabBarActiveTintColor: feedTheme.accent,
        tabBarInactiveTintColor: feedTheme.textMuted,
        headerStyle: { backgroundColor: feedTheme.bg },
        headerTintColor: feedTheme.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Fil local",
          tabBarLabel: "Fil",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="passport"
        options={{
          title: "Passport",
          tabBarLabel: "Passport",
          headerShown: false,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: "Profil", tabBarLabel: "Profil" }} />
      <Tabs.Screen name="organizations" options={{ title: "Lieux", tabBarLabel: "Lieux" }} />
    </Tabs>
  );
}
