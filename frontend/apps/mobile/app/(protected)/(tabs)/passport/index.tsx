import { EmptyPassportState } from "@/components/passport/empty-passport-state";
import { OfferCard } from "@/components/passport/offer-card";
import { PassportCard } from "@/components/passport/passport-card";
import { PassportLevelAbout } from "@/components/passport/passport-level-about";
import { passportTheme } from "@/components/passport/passport-theme";
import { StampCard } from "@/components/passport/stamp-card";
import { usePassport } from "@/hooks/use-passport";
import { usePassportOffers } from "@/hooks/use-passport-offers";
import { usePassportStamps } from "@/hooks/use-passport-stamps";
import {
  PASSPORT_STAMPS_EMPTY,
  PASSPORT_STAMPS_SECTION_TITLE,
} from "@yunicity/utils";
import { Link } from "expo-router";
import { useEffect, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function PassportScreen() {
  const {
    passport,
    profile,
    error,
    isLoading,
    isActivating,
    justActivated,
    activate,
    clearJustActivated,
  } = usePassport();
  const hasPassport = passport !== null;
  const {
    stamps,
    isLoading: stampsLoading,
    error: stampsError,
  } = usePassportStamps(hasPassport);
  const {
    offers,
    isLoading: offersLoading,
    error: offersError,
    redeem,
    redeemingId,
    feedback,
    redeemedIds,
    clearFeedback,
  } = usePassportOffers(hasPassport);

  useEffect(() => {
    if (!justActivated) {
      return;
    }
    const timer = setTimeout(() => clearJustActivated(), 3200);
    return () => clearTimeout(timer);
  }, [justActivated, clearJustActivated]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={passportTheme.accent} />
        <Text style={styles.loadingText}>Préparation de ton passeport…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {!hasPassport ? (
        <EmptyPassportState
          onActivate={() => void activate()}
          isActivating={isActivating}
          error={error}
        />
      ) : (
        <>
          {justActivated ? (
            <View style={styles.successBanner}>
              <Text style={styles.successTitle}>Bienvenue, citoyen·ne</Text>
              <Text style={styles.successText}>Ton passeport Yunicity est actif.</Text>
            </View>
          ) : null}
          <PassportCard passport={passport} profile={profile} />
          <PassportLevelAbout passport={passport} />

          <Link href="/(protected)/passport/present" asChild>
            <Pressable style={styles.presentCta}>
              <Text style={styles.presentCtaText}>Présenter mon passeport</Text>
              <Text style={styles.presentCtaHint}>QR plein écran pour le partenaire</Text>
            </Pressable>
          </Link>

          <Section
            title={PASSPORT_STAMPS_SECTION_TITLE}
            subtitle="Souvenirs de vos passages et découvertes sur le territoire"
          >
            {stampsLoading ? (
              <ActivityIndicator color={passportTheme.accent} />
            ) : stampsError ? (
              <Text style={styles.sectionError}>{stampsError}</Text>
            ) : stamps.length === 0 ? (
              <Text style={styles.empty}>{PASSPORT_STAMPS_EMPTY}</Text>
            ) : (
              stamps.map((stamp) => <StampCard key={stamp.id} stamp={stamp} />)
            )}
          </Section>

          <Section title="Offres partenaires" subtitle="Lieux vérifiés sur le territoire">
            {feedback ? (
              <Pressable onPress={clearFeedback}>
                <Text
                  style={
                    feedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError
                  }
                >
                  {feedback.message}
                </Text>
              </Pressable>
            ) : null}
            {offersLoading ? (
              <ActivityIndicator color={passportTheme.accent} />
            ) : offersError ? (
              <Text style={styles.sectionError}>{offersError}</Text>
            ) : offers.length === 0 ? (
              <Text style={styles.empty}>
                Aucune offre disponible dans ta ville pour le moment.
              </Text>
            ) : (
              offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onRedeem={() => void redeem(offer.id)}
                  isRedeeming={redeemingId === offer.id}
                  disabled={redeemedIds.has(offer.id)}
                />
              ))
            )}
          </Section>
        </>
      )}
    </ScrollView>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: passportTheme.bg },
  content: { padding: 16, paddingBottom: 48, gap: 24 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: passportTheme.bg,
    gap: 12,
  },
  loadingText: { color: passportTheme.textMuted, fontSize: 14 },
  successBanner: {
    backgroundColor: "rgba(74, 222, 128, 0.12)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.35)",
  },
  successTitle: { color: passportTheme.success, fontWeight: "700", fontSize: 16 },
  successText: { color: passportTheme.textMuted, marginTop: 4, fontSize: 13 },
  presentCta: {
    backgroundColor: "#fafaf9",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: passportTheme.borderAccent,
  },
  presentCtaText: { color: "#0c0a09", fontWeight: "800", fontSize: 16 },
  presentCtaHint: { color: "#78716c", fontSize: 12, marginTop: 4 },
  section: { gap: 8 },
  sectionTitle: { color: passportTheme.text, fontSize: 18, fontWeight: "700" },
  sectionSubtitle: { color: passportTheme.textSubtle, fontSize: 12 },
  sectionBody: { gap: 10, marginTop: 4 },
  sectionError: { color: passportTheme.error, fontSize: 13 },
  empty: { color: passportTheme.textMuted, fontSize: 14, lineHeight: 20 },
  feedbackSuccess: { color: passportTheme.success, fontSize: 14, marginBottom: 8 },
  feedbackError: { color: passportTheme.error, fontSize: 14, marginBottom: 8 },
});
