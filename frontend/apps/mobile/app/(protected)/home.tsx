import { useAuth } from "@/lib/auth-provider";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ProtectedHomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zone protégée</Text>
      <Text style={styles.subtitle}>Bonjour {user?.full_name}</Text>
      <Text style={styles.meta}>{user?.email}</Text>
      <Text style={styles.meta}>Rôles : {user?.roles.join(", ")}</Text>
      <Pressable
        style={styles.button}
        onPress={async () => {
          await logout();
          router.replace("/login");
        }}
      >
        <Text style={styles.buttonText}>Déconnexion</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 16 },
  meta: { fontSize: 14, color: "#525252" },
  button: {
    marginTop: 16,
    backgroundColor: "#171717",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
