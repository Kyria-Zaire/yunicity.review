import { HealthCheckPanel } from "@/components/health-check-panel";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yunicity</Text>
      <Text style={styles.subtitle}>Mobile — fondation sans feature métier</Text>
      <HealthCheckPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fafafa",
    gap: 16,
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
});
