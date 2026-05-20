import type { SearchGroupKey, SearchResultItem } from "@yunicity/types";
import { searchResultHref, searchResultSubtitle, searchResultTitle } from "@yunicity/utils";
import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { feedTheme } from "@/components/feed/feed-theme";

type SearchResultCardProps = {
  item: SearchResultItem;
  groupKey: SearchGroupKey;
  city: string;
};

export function SearchResultCard({ item, groupKey, city }: SearchResultCardProps) {
  const title = searchResultTitle(item);
  const subtitle = searchResultSubtitle(item, groupKey, city);
  const href = searchResultHref(item, groupKey, city)?.mobile as Href | undefined;

  const content = (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );

  if (!href) return content;

  return (
    <Link href={href} asChild>
      <Pressable>{content}</Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: feedTheme.border,
    borderRadius: feedTheme.radiusSm,
    backgroundColor: feedTheme.bgElevated,
    padding: 12,
    gap: 4,
  },
  title: { fontSize: 15, fontWeight: "600", color: feedTheme.text },
  subtitle: { fontSize: 13, color: feedTheme.textMuted, lineHeight: 18 },
});
