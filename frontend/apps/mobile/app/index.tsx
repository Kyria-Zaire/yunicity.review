import { HealthCheckPanel } from "@/components/health-check-panel";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yunicity</Text>
      <Text style={styles.subtitle}>Mobile — fondation auth</Text>
      <HealthCheckPanel />
      <Link href="/login" style={styles.link}>
        Connexion
      </Link>
      <Link href="/register" style={styles.link}>
        Inscription
      </Link>
      <Link href="/(protected)/(tabs)/profile" style={styles.link}>
        Zone protégée
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fafafa",
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0a0a0a",
  },
  subtitle: {
    fontSize: 14,
    color: "#525252",
  },
  link: {
    color: "#2563eb",
    fontSize: 16,
  },
});
