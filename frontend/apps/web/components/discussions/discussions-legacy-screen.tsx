"use client";

import type { DiscussionCategoryId, FeedReportReason } from "@yunicity/types";
import {
  DISCUSSIONS_EMPTY,
  DISCUSSIONS_ERROR,
  DISCUSSIONS_LOAD_MORE,
  DISCUSSIONS_LOADING,
  DISCUSSIONS_PAGE_SUBTITLE,
  DISCUSSIONS_PAGE_TITLE,
  DISCUSSIONS_RETRY,
} from "@yunicity/utils";
import { ChevronDown, MessageCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { DiscussionsCategoryChips } from "@/components/discussions/discussions-category-chips";
import { DiscussionsLeftRail } from "@/components/discussions/discussions-left-rail";
import { DiscussionsRightRail } from "@/components/discussions/discussions-right-rail";
import { DiscussionsThreadCard } from "@/components/discussions/discussions-thread-card";
import type { useDiscussionsList } from "@/hooks/use-discussions-list";
import type { useDiscussionsPortalContext } from "@/hooks/use-discussions-portal-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";

type DiscussionsLegacyScreenProps = {
  portal: ReturnType<typeof useDiscussionsPortalContext>;
  list: ReturnType<typeof useDiscussionsList>;
  category: DiscussionCategoryId;
  onCategoryChange: (category: DiscussionCategoryId) => void;
};

export function DiscussionsLegacyScreen({
  portal,
  list,
  category,
  onCategoryChange,
}: DiscussionsLegacyScreenProps) {
  const api = useYunicityApi();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#thread-")) return;
    const threadId = hash.slice("#thread-".length);
    if (!threadId) return;
    setExpandedId(threadId);
    requestAnimationFrame(() => {
      document.getElementById(`thread-${threadId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [list.items, list.isLoading]);

  async function handleReport(postId: string, reason: FeedReportReason) {
    await api.reportFeedPost(postId, { reason });
  }

  return (
    <>
      <DiscussionsLeftRail city={portal.city} tribes={portal.tribes} />

      <div className="min-w-0 flex-1">
        <header className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF0FF] text-yunicity-primary">
            <MessageCircle className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              {DISCUSSIONS_PAGE_TITLE}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600 sm:text-base">
              {DISCUSSIONS_PAGE_SUBTITLE}
            </p>
          </div>
        </header>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DiscussionsCategoryChips activeCategory={category} onCategoryChange={onCategoryChange} />
          <Link
            href="/discussions/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary/90"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nouvelle discussion
          </Link>
        </div>

        <div id="discussions-composer" className="mt-6 scroll-mt-24">
          <div className="rounded-2xl border border-neutral-200/90 bg-white px-5 py-4 shadow-sm sm:px-6 sm:py-5">
            <p className="text-sm text-neutral-600">
              Une question, un avis ou un besoin d&apos;aide pour la communauté rémoise ?
            </p>
            <Link
              href="/discussions/new"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary/90"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Lancer une discussion
            </Link>
          </div>
        </div>

        {list.error ? (
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">{DISCUSSIONS_ERROR}</p>
            <button
              type="button"
              onClick={() => list.refresh()}
              className="mt-3 rounded-full bg-yunicity-primary px-5 py-2 text-sm font-semibold text-white"
            >
              {DISCUSSIONS_RETRY}
            </button>
          </div>
        ) : null}

        {!list.error && list.isLoading ? (
          <p className="mt-8 text-center text-sm text-neutral-500">{DISCUSSIONS_LOADING}</p>
        ) : null}

        {!list.error && !list.isLoading && list.items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-10 text-center">
            <p className="text-sm text-neutral-600">{DISCUSSIONS_EMPTY}</p>
            <Link
              href="/discussions/new"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary/90"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Nouvelle discussion
            </Link>
          </div>
        ) : null}

        <ul className="mt-6 space-y-4">
          {list.items.map((thread) => (
            <li key={thread.id}>
              <DiscussionsThreadCard
                thread={thread}
                expanded={expandedId === thread.id}
                onToggleExpand={() =>
                  setExpandedId((current) => (current === thread.id ? null : thread.id))
                }
                onToggleLike={list.toggleLike}
                onReport={handleReport}
              />
            </li>
          ))}
        </ul>

        {list.nextCursor && !list.isLoading ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              disabled={list.isLoadingMore}
              onClick={list.loadMore}
              className="inline-flex items-center gap-2 rounded-full border-2 border-yunicity-primary bg-white px-6 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF] disabled:opacity-60"
            >
              {DISCUSSIONS_LOAD_MORE}
              <ChevronDown className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}

        <div className="mt-8 2xl:hidden">
          <DiscussionsRightRail
            insights={portal.insights}
            loading={portal.loading}
            onSelectTopic={(topicId) => onCategoryChange(topicId as DiscussionCategoryId)}
          />
        </div>
      </div>
    </>
  );
}
