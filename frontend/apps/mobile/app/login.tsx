import { useAuth } from "@/lib/auth-provider";
import { useRedirectWhenAuthenticated } from "@/lib/use-redirect-when-authenticated";
import { Link } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function LoginScreen() {
  const { login, error, clearError } = useAuth();
  const { showAuthGate } = useRedirectWhenAuthenticated();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (showAuthGate) {
    return (
      <View style={styles.gate}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable
        style={styles.button}
        disabled={isSubmitting}
        onPress={async () => {
          clearError();
          setIsSubmitting(true);
          try {
            await login({ email, password });
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Se connecter</Text>
        )}
      </Pressable>
      <Link href="/register" style={styles.link}>
        Créer un compte
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  gate: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 12 },
  title: { fontSize: 24, fontWeight: "700" },
  error: { color: "#b91c1c", fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d4",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  link: { color: "#2563eb", textAlign: "center", marginTop: 8 },
});
