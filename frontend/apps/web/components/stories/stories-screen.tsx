"use client";

import type { StoryCategoryId, StoryItem, StoryTabId } from "@yunicity/types";
import {
  STORIES_EMPTY,
  STORIES_ERROR,
  STORIES_JUST_PUBLISHED_STORAGE_KEY,
  STORIES_LOAD_MORE,
  STORIES_LOADING,
  STORIES_PAGE_SUBTITLE,
  STORIES_PAGE_TITLE,
  STORIES_RETRY,
  STORY_CATEGORY_NAV,
  buildStoryRingDisplay,
} from "@yunicity/utils";
import type { FeedStoryShortcut } from "@yunicity/utils";
import { CircleDot } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { FeedStoriesRail } from "@/components/feed/portal/feed-stories-rail";
import { StoriesAppShell } from "@/components/stories/stories-app-shell";
import { StoriesLeftRail } from "@/components/stories/stories-left-rail";
import { StoriesRightRail } from "@/components/stories/stories-right-rail";
import { StoriesViewTabs } from "@/components/stories/stories-view-tabs";
import { StoryCard } from "@/components/stories/story-card";
import { useStoriesList } from "@/hooks/use-stories-list";
import { useStoriesPortalContext } from "@/hooks/use-stories-portal-context";

export function StoriesScreen() {
  const portal = useStoriesPortalContext();
  const [tab, setTab] = useState<StoryTabId>("for_you");
  const [category, setCategory] = useState<StoryCategoryId>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const list = useStoriesList(tab, category);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORIES_JUST_PUBLISHED_STORAGE_KEY);
    if (!raw) return;
    try {
      const story = JSON.parse(raw) as StoryItem;
      sessionStorage.removeItem(STORIES_JUST_PUBLISHED_STORAGE_KEY);
      list.prependStory(story);
      setTab("recent");
    } catch {
      sessionStorage.removeItem(STORIES_JUST_PUBLISHED_STORAGE_KEY);
    }
  }, [list.prependStory]);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#story-")) return;
    const storyId = hash.slice("#story-".length);
    if (!storyId) return;
    requestAnimationFrame(() => {
      document.getElementById(`story-${storyId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [list.items, list.isLoading]);

  const ringShortcuts = useMemo((): FeedStoryShortcut[] => {
    return buildStoryRingDisplay({
      profile: portal.profile,
      rings: portal.rings,
    }).map((ring) => ({
      id: ring.id,
      kind: ring.kind === "publish" ? "publish" : "tribe",
      name: ring.name,
      subtitle: ring.subtitle,
      imageUrl: ring.imageUrl,
      href: ring.href,
      hasActivity: ring.hasActivity,
    }));
  }, [portal.profile, portal.rings]);

  const rightRail = (
    <StoriesRightRail
      insights={portal.insights}
      loading={portal.loading}
      activeCategory={category}
      onCategoryChange={setCategory}
    />
  );

  if (portal.loading && list.isLoading) {
    return (
      <StoriesAppShell>
        <StoriesLeftRail city={portal.city} tribes={[]} featured={null} />
        <p className="flex-1 py-16 text-center text-sm text-neutral-500" role="status">
          {STORIES_LOADING}
        </p>
      </StoriesAppShell>
    );
  }

  return (
    <StoriesAppShell rightRail={rightRail}>
      <StoriesLeftRail
        city={portal.city}
        tribes={portal.tribes}
        featured={portal.insights?.featured ?? null}
      />

      <div className="min-w-0 flex-1">
        <header className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF0FF] text-yunicity-primary">
            <CircleDot className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              {STORIES_PAGE_TITLE}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600 sm:text-base">
              {STORIES_PAGE_SUBTITLE}
            </p>
          </div>
        </header>

        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white px-4 py-5 shadow-sm sm:px-6">
          <FeedStoriesRail items={ringShortcuts} seeAllHref="/stories" />
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-200/90 bg-white px-4 py-2 shadow-sm sm:px-6">
          <StoriesViewTabs
            activeTab={tab}
            onTabChange={setTab}
            filterOpen={filterOpen}
            onToggleFilter={() => setFilterOpen((v) => !v)}
          />
          {filterOpen && category !== "all" ? (
            <p className="border-t border-neutral-100 py-3 text-xs text-neutral-500">
              Catégorie active : {STORY_CATEGORY_NAV.find((c) => c.id === category)?.label}
            </p>
          ) : null}
        </div>

        {list.error ? (
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">{STORIES_ERROR}</p>
            <button
              type="button"
              onClick={() => list.refresh()}
              className="mt-3 rounded-full bg-yunicity-primary px-5 py-2 text-sm font-semibold text-white"
            >
              {STORIES_RETRY}
            </button>
          </div>
        ) : null}

        {!list.error && list.isLoading ? (
          <p className="mt-8 text-center text-sm text-neutral-500">{STORIES_LOADING}</p>
        ) : null}

        {!list.error && !list.isLoading && list.items.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-10 text-center text-sm text-neutral-600">
            {STORIES_EMPTY}
          </p>
        ) : null}

        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.items.map((story) => (
            <li key={story.id}>
              <StoryCard story={story} city={portal.city} />
            </li>
          ))}
        </ul>

        {list.nextCursor && !list.isLoading ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              disabled={list.isLoadingMore}
              onClick={list.loadMore}
              className="rounded-full border-2 border-yunicity-primary bg-white px-6 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF] disabled:opacity-60"
            >
              {STORIES_LOAD_MORE}
            </button>
          </div>
        ) : null}

        <div className="mt-8 2xl:hidden">{rightRail}</div>
      </div>
    </StoriesAppShell>
  );
}
