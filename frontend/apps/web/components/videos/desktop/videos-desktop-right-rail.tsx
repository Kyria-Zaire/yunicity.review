"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import type { VideoPortalCreator, VideoPortalTopic } from "@yunicity/utils";
import {
  VIDEOS_DESKTOP_CREATORS,
  VIDEOS_DESKTOP_FOOTER_ABOUT,
  VIDEOS_DESKTOP_FOOTER_ARIA,
  VIDEOS_DESKTOP_FOOTER_COPYRIGHT,
  VIDEOS_DESKTOP_FOOTER_HELP,
  VIDEOS_DESKTOP_FOOTER_PRIVACY,
  VIDEOS_DESKTOP_FOOTER_TERMS,
  VIDEOS_DESKTOP_TOPICS,
  VIDEOS_DESKTOP_UP_NEXT,
  VIDEOS_DESKTOP_VIEW_PROFILE,
  buildLocalVideoTeaserHref,
  formatLocalVideoDuration,
  formatLocalVideoTypeLabel,
  resolveLocalVideoTeaserTitle,
} from "@yunicity/utils";
import Link from "next/link";

type VideosDesktopRightRailProps = {
  upNext: readonly LocalVideoFeedItem[];
  creators: readonly VideoPortalCreator[];
  topics: readonly VideoPortalTopic[];
  onTopicSelect: (type: VideoPortalTopic["type"]) => void;
};

const FOOTER_LINKS = [
  { href: "/settings", label: VIDEOS_DESKTOP_FOOTER_ABOUT },
  { href: "/settings", label: VIDEOS_DESKTOP_FOOTER_HELP },
  { href: "/legal/confidentialite", label: VIDEOS_DESKTOP_FOOTER_PRIVACY },
  { href: "/legal/conditions-generales", label: VIDEOS_DESKTOP_FOOTER_TERMS },
] as const;

function creatorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "YU";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function VideosDesktopRightRail({
  upNext,
  creators,
  topics,
  onTopicSelect,
}: VideosDesktopRightRailProps) {
  return (
    <aside className="videos-desktop-right-rail" aria-label="Découverte vidéos">
      {upNext.length > 0 ? (
        <section className="feed-desktop-surface mb-4 overflow-hidden" aria-labelledby="videos-up-next">
          <h2 id="videos-up-next" className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900">
            {VIDEOS_DESKTOP_UP_NEXT}
          </h2>
          <ul className="divide-y divide-neutral-100">
            {upNext.map((item) => {
              const href = buildLocalVideoTeaserHref(item.id);
              const placeLabel =
                item.cultural_place_name?.trim() || item.neighborhood_name?.trim() || item.city;
              return (
                <li key={item.id}>
                  <Link href={href} className="group flex gap-3 px-4 py-3 transition hover:bg-neutral-50">
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumbnail_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 rounded bg-neutral-950/80 px-1 py-0.5 text-[10px] font-semibold tabular-nums text-white">
                        {formatLocalVideoDuration(item.duration_seconds)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 group-hover:text-yunicity-primary">
                        {resolveLocalVideoTeaserTitle(item)}
                      </p>
                      <p className="mt-1 truncate text-xs text-neutral-500">
                        {placeLabel} · {formatLocalVideoTypeLabel(item.video_type)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {creators.length > 0 ? (
        <section className="feed-desktop-surface mb-4 overflow-hidden" aria-labelledby="videos-creators">
          <h2
            id="videos-creators"
            className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900"
          >
            {VIDEOS_DESKTOP_CREATORS}
          </h2>
          <ul className="divide-y divide-neutral-100">
            {creators.slice(0, 5).map((creator) => {
              const profileHref = creator.handle.startsWith("@")
                ? `/profile/${encodeURIComponent(creator.handle.replace(/^@/, ""))}`
                : null;
              return (
                <li key={creator.authorUserId} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-yunicity-primary-soft">
                    {creator.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={creator.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-bold text-yunicity-primary">
                        {creatorInitials(creator.displayName)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">{creator.displayName}</p>
                    <p className="truncate text-xs text-neutral-500">{creator.handle}</p>
                  </div>
                  {profileHref ? (
                    <Link
                      href={profileHref}
                      className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-yunicity-primary/40 hover:text-yunicity-primary"
                    >
                      {VIDEOS_DESKTOP_VIEW_PROFILE}
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {topics.length > 0 ? (
        <section className="feed-desktop-surface mb-4 overflow-hidden" aria-labelledby="videos-topics">
          <h2 id="videos-topics" className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900">
            {VIDEOS_DESKTOP_TOPICS}
          </h2>
          <div className="flex flex-wrap gap-2 p-4">
            {topics.map((topic) => (
              <button
                key={topic.type}
                type="button"
                onClick={() => onTopicSelect(topic.type)}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-yunicity-primary/40 hover:bg-yunicity-primary-soft hover:text-yunicity-primary"
              >
                {topic.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="mt-2 space-y-1.5 px-1 text-[11px] leading-relaxed text-neutral-400" aria-label={VIDEOS_DESKTOP_FOOTER_ARIA}>
        <nav className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {FOOTER_LINKS.map((link, index) => (
            <span key={link.href + link.label} className="inline-flex items-center gap-x-1.5">
              {index > 0 ? <span aria-hidden>·</span> : null}
              <Link href={link.href} className="transition hover:text-neutral-600">
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
        <p>
          {VIDEOS_DESKTOP_FOOTER_COPYRIGHT.replace("{year}", String(new Date().getFullYear()))}
        </p>
      </footer>
    </aside>
  );
}
