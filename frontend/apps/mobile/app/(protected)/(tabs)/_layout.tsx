import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: { backgroundColor: "#0c0a09", borderTopColor: "rgba(255,255,255,0.08)" },
        tabBarActiveTintColor: "#d4a574",
        tabBarInactiveTintColor: "#78716c",
        headerStyle: { backgroundColor: "#0c0a09" },
        headerTintColor: "#fafaf9",
      }}
    >
      <Tabs.Screen name="profile" options={{ title: "Profil", tabBarLabel: "Profil" }} />
      <Tabs.Screen
        name="passport"
        options={{
          title: "Passport",
          tabBarLabel: "Passport",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="organizations"
        options={{ title: "Lieux", tabBarLabel: "Lieux" }}
      />
    </Tabs>
  );
}
