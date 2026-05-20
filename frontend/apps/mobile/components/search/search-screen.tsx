import {
  SEARCH_CITY_LABEL,
  SEARCH_EMPTY_BODY,
  SEARCH_EMPTY_TITLE,
  SEARCH_ERROR,
  SEARCH_INITIAL_BODY,
  SEARCH_INITIAL_TITLE,
  SEARCH_MIN_QUERY_HINT,
  SEARCH_PAGE_SUBTITLE,
  SEARCH_PAGE_TITLE,
  SEARCH_PLACEHOLDER,
  SEARCH_RETRY,
  isSearchInitialState,
  visibleSearchGroups,
} from "@yunicity/utils";
import type { Href } from "expo-router";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { feedTheme } from "@/components/feed/feed-theme";
import { SearchGroupSection } from "@/components/search/search-group-section";
import { SearchTypeTabs } from "@/components/search/search-type-tabs";
import { useSearch } from "@/hooks/use-search";
import { useAuth } from "@/lib/auth-provider";

export function SearchScreen() {
  const { yunicityApi, user } = useAuth();
  const [profileCity, setProfileCity] = useState(user?.city ?? "Reims");
  const search = useSearch(profileCity);

  useEffect(() => {
    void yunicityApi.getProfileMe().then((p) => {
      if (p.city) setProfileCity(p.city);
    });
  }, [yunicityApi]);

  const showInitial = isSearchInitialState(search.query, search.hasSearched);
  const sections = visibleSearchGroups(search.groups, search.typeFilter);
  const showEmpty =
    search.hasSearched &&
    search.isQueryReady &&
    !search.loading &&
    !search.error &&
    sections.every((s) => s.group.items.length === 0);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={search.loading && search.hasSearched}
            onRefresh={search.retry}
            tintColor={feedTheme.accent}
          />
        }
      >
        <Text style={styles.title}>{SEARCH_PAGE_TITLE}</Text>
        <Text style={styles.subtitle}>{SEARCH_PAGE_SUBTITLE}</Text>

        <TextInput
          value={search.query}
          onChangeText={search.setQuery}
          placeholder={SEARCH_PLACEHOLDER}
          placeholderTextColor={feedTheme.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.input}
        />
        {!search.isQueryReady && search.query.length > 0 ? (
          <Text style={styles.hint}>{SEARCH_MIN_QUERY_HINT}</Text>
        ) : null}

        <View style={styles.cityRow}>
          <Text style={styles.cityLabel}>{SEARCH_CITY_LABEL}</Text>
          <TextInput
            value={search.city}
            onChangeText={search.setCity}
            style={styles.cityInput}
          />
        </View>

        <SearchTypeTabs value={search.typeFilter} onChange={search.setTypeFilter} />

        {showInitial ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{SEARCH_INITIAL_TITLE}</Text>
            <Text style={styles.panelBody}>{SEARCH_INITIAL_BODY}</Text>
          </View>
        ) : null}

        {search.loading && !showInitial ? (
          <ActivityIndicator color={feedTheme.accent} style={styles.spinner} />
        ) : null}

        {search.error ? (
          <View style={styles.panel}>
            <Text style={styles.errorText}>{SEARCH_ERROR}</Text>
            <Pressable style={styles.retryBtn} onPress={search.retry}>
              <Text style={styles.retryText}>{SEARCH_RETRY}</Text>
            </Pressable>
          </View>
        ) : null}

        {showEmpty ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{SEARCH_EMPTY_TITLE}</Text>
            <Text style={styles.panelBody}>{SEARCH_EMPTY_BODY}</Text>
          </View>
        ) : null}

        <View style={styles.sections}>
          {sections.map(({ key, group }) => (
            <SearchGroupSection
              key={key}
              groupKey={key}
              group={group}
              city={search.city}
              onLoadMore={() => search.loadMoreForGroup(key)}
              loadingMore={search.loading}
            />
          ))}
        </View>

        <Link href={"/(protected)/(tabs)/feed" as Href} asChild>
          <Pressable style={styles.backLink}>
            <Text style={styles.backLinkText}>Retour au fil local</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: feedTheme.bg },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  title: { fontSize: 26, fontWeight: "700", color: feedTheme.text },
  subtitle: { fontSize: 14, color: feedTheme.textMuted, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: feedTheme.border,
    borderRadius: feedTheme.radiusSm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: feedTheme.text,
    backgroundColor: feedTheme.bgElevated,
  },
  hint: { fontSize: 12, color: feedTheme.textMuted },
  cityRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cityLabel: { fontSize: 14, color: feedTheme.textMuted },
  cityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: feedTheme.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: feedTheme.text,
  },
  panel: {
    borderWidth: 1,
    borderColor: feedTheme.border,
    borderRadius: feedTheme.radiusSm,
    padding: 16,
    gap: 8,
    backgroundColor: feedTheme.bgElevated,
  },
  panelTitle: { fontSize: 16, fontWeight: "700", color: feedTheme.text },
  panelBody: { fontSize: 14, color: feedTheme.textMuted, lineHeight: 20 },
  errorText: { fontSize: 14, color: "#b91c1c" },
  retryBtn: { alignSelf: "flex-start", marginTop: 4 },
  retryText: { fontSize: 14, fontWeight: "600", color: feedTheme.accent },
  spinner: { marginVertical: 8 },
  sections: { gap: 20, marginTop: 4 },
  backLink: { marginTop: 8, paddingVertical: 12 },
  backLinkText: { fontSize: 14, fontWeight: "600", color: feedTheme.accent },
});
