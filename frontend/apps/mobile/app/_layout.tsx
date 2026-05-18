import { AuthProvider } from "@/lib/auth-provider";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: true }} />
    </AuthProvider>
  );
}
