import type { PassportMe, ProfileMe } from "@yunicity/types";
import { formatPassportDate } from "@yunicity/utils";
import { Image, StyleSheet, Text, View } from "react-native";

import { PassportQrPlaceholder } from "./passport-qr-placeholder";
import { PassportTierBadge } from "./passport-tier-badge";
import { passportTheme } from "./passport-theme";

export function PassportCard({
  passport,
  profile,
}: {
  passport: PassportMe;
  profile: ProfileMe | null;
}) {
  const displayName = profile?.display_name ?? profile?.username ?? "Citoyen";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>YUNICITY</Text>
          <Text style={styles.territory}>PASSPORT</Text>
        </View>
        <Text style={styles.number}>{passport.passport_number}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.identity}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.identityText}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.city}>{passport.city}</Text>
          </View>
        </View>

        <PassportTierBadge code={passport.tier.code} />

        <View style={styles.statsRow}>
          <Stat label="Tampons" value={String(passport.stats.stamps_count)} />
          <Stat label="Offres" value={String(passport.stats.redemptions_count)} />
          <Stat
            label="Activé"
            value={formatPassportDate(passport.activated_at).split(" ")[0] ?? "—"}
          />
        </View>

        <PassportQrPlaceholder qrToken={passport.qr_token} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Identité citoyenne territoriale</Text>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: passportTheme.radius,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: passportTheme.borderGold,
    backgroundColor: passportTheme.bgCard,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: passportTheme.border,
  },
  brandRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  brand: {
    color: passportTheme.gold,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 3,
  },
  territory: {
    color: passportTheme.textMuted,
    fontSize: 10,
    letterSpacing: 2,
  },
  number: {
    marginTop: 8,
    color: passportTheme.text,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 1,
  },
  body: { padding: 20, gap: 16 },
  identity: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: passportTheme.bgElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: passportTheme.borderGold,
  },
  avatarText: { color: passportTheme.gold, fontWeight: "700", fontSize: 18 },
  identityText: { flex: 1, gap: 2 },
  name: { color: passportTheme.text, fontSize: 20, fontWeight: "700" },
  city: { color: passportTheme.textMuted, fontSize: 14 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: passportTheme.border,
  },
  stat: { alignItems: "center", flex: 1 },
  statValue: { color: passportTheme.text, fontSize: 16, fontWeight: "700" },
  statLabel: { color: passportTheme.textSubtle, fontSize: 11, marginTop: 2 },
  footer: {
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
  },
  footerText: {
    color: passportTheme.textSubtle,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
