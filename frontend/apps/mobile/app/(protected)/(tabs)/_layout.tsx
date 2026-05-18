import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#171717",
        tabBarInactiveTintColor: "#737373",
      }}
    >
      <Tabs.Screen name="profile" options={{ title: "Profil", tabBarLabel: "Profil" }} />
      <Tabs.Screen
        name="organizations"
        options={{ title: "Lieux", tabBarLabel: "Lieux" }}
      />
    </Tabs>
  );
}
