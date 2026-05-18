import { useAuth } from "@/lib/auth-provider";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="organizations/request"
        options={{ headerShown: true, title: "Proposer un lieu" }}
      />
      <Stack.Screen
        name="partner-offers/index"
        options={{ headerShown: true, title: "Offres pour la ville" }}
      />
      <Stack.Screen
        name="partner-offers/new"
        options={{ headerShown: true, title: "Nouvelle offre" }}
      />
      <Stack.Screen
        name="partner-offers/[id]"
        options={{ headerShown: true, title: "Détail offre" }}
      />
    </Stack>
  );
}
