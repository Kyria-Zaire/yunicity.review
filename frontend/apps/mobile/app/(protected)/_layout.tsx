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
      <Stack.Screen
        name="passport/present"
        options={{ headerShown: false, presentation: "fullScreenModal" }}
      />
      <Stack.Screen
        name="partner-scan/index"
        options={{ headerShown: true, title: "Scanner" }}
      />
      <Stack.Screen
        name="partner-scan/scan"
        options={{ headerShown: true, title: "Scanner QR" }}
      />
      <Stack.Screen
        name="partner-scan/manual"
        options={{ headerShown: true, title: "Code manuel" }}
      />
      <Stack.Screen
        name="partner-scan/offers"
        options={{ headerShown: true, title: "Choisir l'offre" }}
      />
      <Stack.Screen
        name="partner-scan/result"
        options={{ headerShown: true, title: "Résultat" }}
      />
    </Stack>
  );
}
