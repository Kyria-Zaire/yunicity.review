import type { SearchTypeFilter } from "@yunicity/types";
import { SEARCH_TYPE_TABS } from "@yunicity/utils";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { feedTheme } from "@/components/feed/feed-theme";

type SearchTypeTabsProps = {
  value: SearchTypeFilter;
  onChange: (value: SearchTypeFilter) => void;
};

export function SearchTypeTabs({ value, onChange }: SearchTypeTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {SEARCH_TYPE_TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            onPress={() => onChange(tab.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    borderWidth: 1,
    borderColor: feedTheme.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: feedTheme.bgElevated,
  },
  chipActive: { backgroundColor: feedTheme.accent, borderColor: feedTheme.accent },
  chipText: { fontSize: 13, color: feedTheme.textMuted },
  chipTextActive: { color: "#fff", fontWeight: "600" },
});
