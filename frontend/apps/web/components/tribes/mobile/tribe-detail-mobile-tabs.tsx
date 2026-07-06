"use client";

import { TribeDetailMobileEventsRail } from "@/components/tribes/mobile/tribe-detail-mobile-events-rail";
import { TribeDetailMobileMembersRail } from "@/components/tribes/mobile/tribe-detail-mobile-members-rail";
import { TribeDetailMobilePostCard } from "@/components/tribes/mobile/tribe-detail-mobile-post-card";
import { TribeMembersSection } from "@/components/tribes/tribe-members-section";
import type { FeedPost, Tribe } from "@yunicity/types";
import type {
  TribeDetailAboutFact,
  TribeDetailEventCard,
  TribeDetailMemberPreview,
  TribeDetailMobileTabId,
} from "@yunicity/utils";
import {
  TRIBE_DETAIL_MOBILE_ABOUT_TITLE,
  TRIBE_DETAIL_MOBILE_FEATURED_TITLE,
  TRIBE_DETAIL_MOBILE_TAB_ABOUT,
  TRIBE_DETAIL_MOBILE_TAB_DISCUSSIONS,
  TRIBE_DETAIL_MOBILE_TAB_EVENTS,
  TRIBE_DETAIL_MOBILE_TAB_FEATURED,
  TRIBE_DETAIL_MOBILE_TAB_MEMBERS,
  TRIBE_DETAIL_MOBILE_VIEW_ALL,
  TRIBE_DETAIL_PORTAL_EVENTS_EMPTY,
  TRIBE_DETAIL_PORTAL_POSTS_EMPTY,
  TRIBE_WALL_MEMBERS_ONLY,
} from "@yunicity/utils";
import { CulturalImage } from "@/components/culture/cultural-image";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TAB_OPTIONS: { id: TribeDetailMobileTabId; label: string }[] = [
  { id: "featured", label: TRIBE_DETAIL_MOBILE_TAB_FEATURED },
  { id: "discussions", label: TRIBE_DETAIL_MOBILE_TAB_DISCUSSIONS },
  { id: "events", label: TRIBE_DETAIL_MOBILE_TAB_EVENTS },
  { id: "members", label: TRIBE_DETAIL_MOBILE_TAB_MEMBERS },
  { id: "about", label: TRIBE_DETAIL_MOBILE_TAB_ABOUT },
];

type TribeDetailMobileTabsProps = {
  tribe: Tribe;
  city: string;
  events: TribeDetailEventCard[];
  members: TribeDetailMemberPreview[];
  membersTotal: number;
  facts: TribeDetailAboutFact[];
  canSeeMembers: boolean;
  canSeePosts: boolean;
  posts: FeedPost[];
  postsLoading: boolean;
  onToggleLike: (post: FeedPost) => void;
  onLoadMorePosts?: () => void;
  hasMorePosts?: boolean;
};

/** Onglets détail tribu mobile (MOBILE-TRIBE-DETAIL-01). */
export function TribeDetailMobileTabs({
  tribe,
  city,
  events,
  members,
  membersTotal,
  facts,
  canSeeMembers,
  canSeePosts,
  posts,
  postsLoading,
  onToggleLike,
  onLoadMorePosts,
  hasMorePosts,
}: TribeDetailMobileTabsProps) {
  const [tab, setTab] = useState<TribeDetailMobileTabId>("featured");

  function switchTab(next: TribeDetailMobileTabId) {
    setTab(next);
  }

  const featuredPost = posts[0] ?? null;

  return (
    <div className="space-y-5">
      <div
        className="flex gap-0 overflow-x-auto border-b border-neutral-200/90 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Sections de la tribu"
      >
        {TAB_OPTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-xs font-semibold transition sm:text-sm ${
              tab === item.id
                ? "border-yunicity-primary text-yunicity-primary"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "featured" ? (
        <div className="space-y-5">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_MOBILE_FEATURED_TITLE}</h2>
              {canSeePosts && posts.length > 1 ? (
                <button
                  type="button"
                  onClick={() => switchTab("discussions")}
                  className="text-sm font-semibold text-yunicity-primary"
                >
                  {TRIBE_DETAIL_MOBILE_VIEW_ALL} →
                </button>
              ) : null}
            </div>

            {!canSeePosts ? (
              <p className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-6 text-sm text-neutral-600">
                {TRIBE_WALL_MEMBERS_ONLY}
              </p>
            ) : postsLoading ? (
              <p className="text-sm text-neutral-500">Chargement…</p>
            ) : featuredPost ? (
              <TribeDetailMobilePostCard
                post={featuredPost}
                onToggleLike={() => onToggleLike(featuredPost)}
              />
            ) : (
              <p className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-6 text-sm text-neutral-600">
                {TRIBE_DETAIL_PORTAL_POSTS_EMPTY}
              </p>
            )}
          </section>

          <TribeDetailMobileEventsRail events={events} onViewAll={() => switchTab("events")} />

          {canSeeMembers ? (
            <TribeDetailMobileMembersRail
              members={members}
              membersTotal={membersTotal}
              onViewAll={() => switchTab("members")}
            />
          ) : null}
        </div>
      ) : null}

      {tab === "discussions" ? (
        <div className="space-y-4">
          {!canSeePosts ? (
            <p className="text-sm text-neutral-600">{TRIBE_WALL_MEMBERS_ONLY}</p>
          ) : postsLoading ? (
            <p className="text-sm text-neutral-500">Chargement…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-neutral-600">{TRIBE_DETAIL_PORTAL_POSTS_EMPTY}</p>
          ) : (
            <ul className="space-y-4">
              {posts.map((post) => (
                <li key={post.id}>
                  <TribeDetailMobilePostCard
                    post={post}
                    onToggleLike={() => onToggleLike(post)}
                  />
                </li>
              ))}
            </ul>
          )}
          {hasMorePosts && onLoadMorePosts ? (
            <button
              type="button"
              onClick={onLoadMorePosts}
              className="w-full rounded-full border border-neutral-200 py-2.5 text-sm font-semibold text-yunicity-primary"
            >
              Charger plus
            </button>
          ) : null}
        </div>
      ) : null}

      {tab === "events" ? (
        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-neutral-500">{TRIBE_DETAIL_PORTAL_EVENTS_EMPTY}</p>
          ) : (
            <ul className="space-y-3">
              {events.map((event) => (
                <li key={event.id}>
                  <Link
                    href={event.href}
                    className="flex gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      {event.imageUrl ? (
                        <CulturalImage
                          src={event.imageUrl}
                          alt=""
                          placeName={event.title}
                          className="size-full object-cover"
                          sizes="80px"
                          showFallbackCaption={false}
                          overlay={false}
                        />
                      ) : (
                        <div className="flex size-full flex-col items-center justify-center bg-pink-50 text-pink-700">
                          <span className="text-[9px] font-bold uppercase">{event.dateBadgeMonth}</span>
                          <span className="text-xl font-bold">{event.dateBadgeDate}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-neutral-900">{event.title}</p>
                      <p className="mt-0.5 text-xs text-neutral-600">{event.timeLabel}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                        <span className="line-clamp-1">{event.locationLabel}</span>
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "members" ? (
        <div>
          {canSeeMembers ? (
            <TribeMembersSection tribe={tribe} city={city} />
          ) : (
            <p className="text-sm text-neutral-600">{TRIBE_WALL_MEMBERS_ONLY}</p>
          )}
        </div>
      ) : null}

      {tab === "about" ? (
        <div className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-4">
          <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_MOBILE_ABOUT_TITLE}</h2>
          {tribe.description?.trim() ? (
            <p className="text-sm leading-relaxed text-neutral-700">{tribe.description.trim()}</p>
          ) : null}
          <dl className="space-y-3 text-sm">
            {facts.map((fact) => (
              <div key={fact.id}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {fact.label}
                </dt>
                <dd className="mt-1 font-medium text-neutral-900">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}
