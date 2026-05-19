import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function PartnerScanCameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Accès caméra</Text>
        <Text style={styles.hint}>
          Autorise la caméra pour scanner le Passport du citoyen sur place.
        </Text>
        <Pressable style={styles.cta} onPress={() => void requestPermission()}>
          <Text style={styles.ctaText}>Autoriser la caméra</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => router.replace("/(protected)/partner-scan/manual")}>
          <Text style={styles.linkText}>Saisir le code à la place</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={
          locked
            ? undefined
            : ({ data }) => {
                if (!data) {
                  return;
                }
                setLocked(true);
                router.replace({
                  pathname: "/(protected)/partner-scan/offers",
                  params: { qr_secret: data },
                });
              }
        }
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Cadre le QR du citoyen</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0a09", padding: 20, justifyContent: "center" },
  camera: { flex: 1, borderRadius: 16, overflow: "hidden" },
  overlay: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  overlayText: {
    color: "#fafaf9",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  title: { color: "#fafaf9", fontSize: 20, fontWeight: "700" },
  hint: { color: "#a8a29e", marginTop: 8, marginBottom: 20 },
  cta: {
    backgroundColor: "#fafaf9",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  ctaText: { color: "#0c0a09", fontWeight: "700" },
  link: { marginTop: 16, alignItems: "center" },
  linkText: { color: "#d4a574" },
});
