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

export default function RegisterScreen() {
  const { register, error, clearError } = useAuth();
  const { showAuthGate } = useRedirectWhenAuthenticated();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
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
      <Text style={styles.title}>Inscription</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Nom complet"
        value={fullName}
        onChangeText={setFullName}
      />
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
            await register({
              email,
              password,
              full_name: fullName,
            });
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Créer un compte</Text>
        )}
      </Pressable>
      <Link href="/login" style={styles.link}>
        Déjà un compte
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
    backgroundColor: "#2A2FFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  link: { color: "#2A2FFF", textAlign: "center", marginTop: 8 },
});
