import type { SearchGroupKey, SearchResultGroup } from "@yunicity/types";
import { SEARCH_GROUP_LABELS, SEARCH_LOAD_MORE, SEARCH_RESULT_COUNT } from "@yunicity/utils";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { feedTheme } from "@/components/feed/feed-theme";
import { SearchResultCard } from "@/components/search/search-result-card";

type SearchGroupSectionProps = {
  groupKey: SearchGroupKey;
  group: SearchResultGroup;
  city: string;
  onLoadMore?: () => void;
  loadingMore?: boolean;
};

export function SearchGroupSection({
  groupKey,
  group,
  city,
  onLoadMore,
  loadingMore = false,
}: SearchGroupSectionProps) {
  if (group.items.length === 0 && group.count === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{SEARCH_GROUP_LABELS[groupKey]}</Text>
        <Text style={styles.count}>{SEARCH_RESULT_COUNT(group.count)}</Text>
      </View>
      {group.items.map((item) => (
        <SearchResultCard key={item.id} item={item} groupKey={groupKey} city={city} />
      ))}
      {group.has_more && onLoadMore ? (
        <Pressable
          style={[styles.moreBtn, loadingMore && styles.moreDisabled]}
          disabled={loadingMore}
          onPress={onLoadMore}
        >
          <Text style={styles.moreText}>{loadingMore ? "Chargement…" : SEARCH_LOAD_MORE}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  title: { fontSize: 16, fontWeight: "700", color: feedTheme.text },
  count: { fontSize: 12, color: feedTheme.textMuted },
  moreBtn: {
    borderWidth: 1,
    borderColor: feedTheme.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  moreDisabled: { opacity: 0.6 },
  moreText: { fontSize: 14, fontWeight: "600", color: feedTheme.text },
});
