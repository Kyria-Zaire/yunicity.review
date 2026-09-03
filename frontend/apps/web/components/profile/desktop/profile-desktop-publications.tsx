"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import type { FeedPost } from "@yunicity/types";
import type { ProfileDesktopGlanceOuting } from "@yunicity/utils";
import {
  formatProfileActivityTimestamp,
  PROFILE_DESKTOP_PUBLICATIONS_CTA,
  PROFILE_DESKTOP_PUBLICATIONS_EMPTY,
  PROFILE_DESKTOP_PUBLICATIONS_TITLE,
  PROFILE_DESKTOP_PUBLICATIONS_VIEW,
  PROFILE_DESKTOP_PUBLIC_SHARED_OUTING,
  PROFILE_DESKTOP_SAVE_ACTION,
  PROFILE_DESKTOP_SHARE_ACTION,
} from "@yunicity/utils";
import { ArrowRight, Bookmark, MoreHorizontal, Share2 } from "lucide-react";
import Link from "next/link";

type ProfileDesktopPublicationsProps = {
  posts: FeedPost[];
  displayName: string;
  avatarUrl?: string | null;
  compact?: boolean;
  /** Sans carte externe (intégré dans « vie locale »). */
  embedded?: boolean;
  maxItems?: number;
  /** Lien « Voir toutes → » en en-tête (profil medium). */
  seeAllHref?: string;
  seeAllLabel?: string;
  /** Sortie partagée sous la première publication (maquette profil public). */
  sharedOuting?: ProfileDesktopGlanceOuting | null;
  /** Ouvre l’onglet Publications au lieu de renvoyer vers le fil. */
  onViewAll?: () => void;
};

export function ProfileDesktopPublications({
  posts,
  displayName,
  avatarUrl = null,
  compact = false,
  embedded = false,
  maxItems = 3,
  seeAllHref,
  seeAllLabel,
  sharedOuting = null,
  onViewAll,
}: ProfileDesktopPublicationsProps) {
  const visible = posts.slice(0, maxItems);

  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2
          className={`font-bold text-neutral-900 ${embedded ? "text-sm" : "text-base"}`}
        >
          {PROFILE_DESKTOP_PUBLICATIONS_TITLE}
        </h2>
        {seeAllHref && seeAllLabel ? (
          <Link
            href={seeAllHref}
            className="shrink-0 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {seeAllLabel} →
          </Link>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">{PROFILE_DESKTOP_PUBLICATIONS_EMPTY}</p>
      ) : compact ? (
        <ul className="mt-3 divide-y divide-neutral-100">
          {visible.map((post) => {
            const text = post.body?.trim() || post.title?.trim() || "";
            const timestamp = formatProfileActivityTimestamp(post.created_at);
            return (
              <li key={post.id} className="flex gap-3 py-3 first:pt-1 last:pb-0">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <ProfileAvatar name={displayName} size="sm" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="text-sm font-bold text-neutral-900">{displayName}</p>
                    <p className="text-xs text-neutral-500">{timestamp}</p>
                  </div>
                  {text ? (
                    <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-neutral-700">
                      {text}
                    </p>
                  ) : null}
                  <Link
                    href="/feed"
                    className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
                  >
                    {PROFILE_DESKTOP_PUBLICATIONS_VIEW}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-4 space-y-4">
          {visible.map((post, index) => {
            const text = post.body?.trim() || post.title?.trim() || "";
            const timestamp = formatProfileActivityTimestamp(post.created_at);
            const isFeatured = index === 0 && Boolean(post.media_url);

            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-xl border border-neutral-100"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <ProfileAvatar name={displayName} size="sm" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-neutral-900">{displayName}</p>
                        <p className="text-xs text-neutral-500">{timestamp}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled
                      aria-label="Options"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-400"
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden />
                    </button>
                  </div>

                  {text ? (
                    <p
                      className={`mt-3 text-sm leading-relaxed text-neutral-800 ${
                        isFeatured ? "" : "line-clamp-3"
                      }`}
                    >
                      {text}
                    </p>
                  ) : null}

                  {isFeatured && post.media_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.media_url}
                      alt=""
                      loading="lazy"
                      className="mt-3 max-h-72 w-full rounded-xl object-cover"
                    />
                  ) : null}

                  {!isFeatured && post.media_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.media_url}
                      alt=""
                      loading="lazy"
                      className="mt-3 h-20 w-20 rounded-lg object-cover"
                    />
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600"
                    >
                      <Share2 className="h-4 w-4" aria-hidden />
                      {PROFILE_DESKTOP_SHARE_ACTION}
                    </button>
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600"
                    >
                      <Bookmark className="h-4 w-4" aria-hidden />
                      {PROFILE_DESKTOP_SAVE_ACTION}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {sharedOuting ? (
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3">
              <p className="mb-2 text-xs font-medium text-neutral-500">
                {PROFILE_DESKTOP_PUBLIC_SHARED_OUTING(displayName)}
              </p>
              <Link
                href={sharedOuting.href}
                className="flex items-center gap-3 rounded-lg border border-neutral-200/90 bg-white p-3 transition hover:border-yunicity-primary/30"
              >
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EEF0FF] text-yunicity-primary">
                  <Bookmark className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-neutral-900">{sharedOuting.title}</p>
                  {sharedOuting.whenLabel ? (
                    <p className="mt-0.5 text-xs text-neutral-500">{sharedOuting.whenLabel}</p>
                  ) : null}
                </div>
              </Link>
            </div>
          ) : null}
        </div>
      )}

      {!compact && posts.length > 0 ? (
        onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]/50"
          >
            {PROFILE_DESKTOP_PUBLICATIONS_CTA}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : (
          <Link
            href="/feed"
            className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]/50"
          >
            {PROFILE_DESKTOP_PUBLICATIONS_CTA}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )
      ) : null}
    </>
  );

  if (embedded) {
    return <div data-profile-desktop-publications="">{body}</div>;
  }

  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm"
      data-profile-desktop-publications=""
    >
      {body}
    </section>
  );
}
