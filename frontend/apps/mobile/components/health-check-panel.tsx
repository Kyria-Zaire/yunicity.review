import type { HealthResponse } from "@yunicity/types";
import { getAppEnvironmentLabel, getExpoApiBaseUrl, safeFetch } from "@yunicity/utils";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type LoadState = "idle" | "loading" | "success" | "error";

export function HealthCheckPanel() {
  const [state, setState] = useState<LoadState>("idle");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setState("loading");
    setError(null);
    const base = getExpoApiBaseUrl();
    const result = await safeFetch<HealthResponse>(`${base}/api/v1/health`);
    if (!result.ok) {
      setHealth(null);
      setError(result.error);
      setState("error");
      return;
    }
    setHealth(result.data);
    setState("success");
  }, []);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Statut API</Text>
      <Pressable style={styles.button} onPress={() => void check()} disabled={state === "loading"}>
        {state === "loading" ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Vérifier /health</Text>
        )}
      </Pressable>
      {state === "error" && error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
      {state === "success" && health && (
        <View style={styles.result}>
          <Text style={styles.row}>
            Statut : <Text style={styles.ok}>{health.status}</Text>
          </Text>
          <Text style={styles.row}>Service : {health.service}</Text>
          <Text style={styles.row}>
            Env : {health.environment} ({getAppEnvironmentLabel(health.environment)})
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  error: {
    color: "#dc2626",
    fontSize: 14,
  },
  result: {
    gap: 6,
  },
  row: {
    fontSize: 14,
    color: "#404040",
  },
  ok: {
    color: "#16a34a",
    fontWeight: "600",
  },
});
