import { feedTheme } from "@/components/feed/feed-theme";
import type { FeedNeighborhoodSummary } from "@yunicity/types";
import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

export function NeighborhoodBadgeMobile({
  summary,
  city,
}: {
  summary: FeedNeighborhoodSummary;
  city: string | null | undefined;
}) {
  const router = useRouter();
  const resolvedCity = city ?? "Reims";
  return (
    <Pressable
      onPress={() =>
        router.push(
          `/(protected)/neighborhoods/${summary.slug}?city=${encodeURIComponent(resolvedCity)}` as Href,
        )
      }
      style={styles.badge}
    >
      <Text style={styles.text}>{summary.display_name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(42, 47, 255, 0.2)",
    backgroundColor: "rgba(42, 47, 255, 0.06)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
    color: feedTheme.accent,
  },
});
