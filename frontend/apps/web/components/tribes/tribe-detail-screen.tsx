"use client";

import { TribeActions } from "@/components/tribes/tribe-actions";
import { TribeMembersSection } from "@/components/tribes/tribe-members-section";
import { TribeModerationPanel } from "@/components/tribes/tribe-moderation-panel";
import { TribeWallSection } from "@/components/tribes/tribe-wall-section";
import { WebAppShell } from "@/components/layout";
import { useTribeDetail } from "@/hooks/use-tribe-detail";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  TRIBE_ARCHIVED_BODY,
  TRIBE_ARCHIVED_TITLE,
  TRIBE_DETAIL_LOADING,
  TRIBE_FEED_LINK,
  TRIBE_MEMBER_COUNT,
  TRIBE_NOT_FOUND,
  TRIBE_PRIVATE_BODY,
  TRIBE_PRIVATE_TITLE,
  TRIBES_RETRY,
  tribeCategoryLabel,
  tribeVisibilityLabel,
} from "@yunicity/utils";
import Link from "next/link";

export function TribeDetailScreen({ slug, city }: { slug: string; city: string }) {
  const { isAuthenticated } = useAuth();
  const {
    tribe,
    loading,
    error,
    actionError,
    joining,
    leaving,
    reload,
    join,
    leave,
  } = useTribeDetail(slug, city);

  if (loading) {
    return (
      <WebAppShell contentWidth="feed">
        <p className="text-neutral-500">{TRIBE_DETAIL_LOADING}</p>
      </WebAppShell>
    );
  }

  if (error || !tribe) {
    return (
      <WebAppShell contentWidth="readable">
        <p className="text-neutral-700">{error ?? TRIBE_NOT_FOUND}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-4 rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
        >
          {TRIBES_RETRY}
        </button>
      </WebAppShell>
    );
  }

  const showPrivateGate =
    tribe.visibility === "private_invite" && !tribe.viewer_is_member && !tribe.is_archived;

  return (
    <WebAppShell
      contentWidth="feed"
      context={
        <aside className="space-y-3 text-sm text-neutral-600">
          <Link href="/tribes" className="text-yunicity-primary hover:underline">
            Toutes les tribus
          </Link>
          <Link href="/feed" className="block font-medium text-yunicity-primary hover:underline">
            {TRIBE_FEED_LINK}
          </Link>
        </aside>
      }
    >
      <header className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        {tribe.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tribe.cover_image_url}
            alt=""
            className="mb-6 max-h-48 w-full rounded-xl object-cover"
          />
        ) : null}
        <p className="text-sm text-neutral-500">
          {tribe.city} · {tribeCategoryLabel(tribe.category)} ·{" "}
          {tribeVisibilityLabel(tribe.visibility)}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900 sm:text-3xl">{tribe.name}</h1>
        <p className="mt-2 text-xs text-neutral-500">
          {TRIBE_MEMBER_COUNT(tribe.active_member_count, tribe.member_limit)}
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-700">
          {tribe.description}
        </p>
        {!tribe.is_archived && !showPrivateGate ? (
          <div className="mt-6">
            <TribeActions
              tribe={tribe}
              joining={joining}
              leaving={leaving}
              actionError={actionError}
              onJoin={async (accepted) => {
                await join(accepted);
              }}
              onLeave={leave}
              isAuthenticated={isAuthenticated}
            />
          </div>
        ) : null}
      </header>

      {tribe.is_archived ? (
        <div className="mb-8 rounded-xl border border-dashed border-yunicity-border bg-yunicity-surface px-6 py-8">
          <h2 className="font-semibold text-neutral-900">{TRIBE_ARCHIVED_TITLE}</h2>
          <p className="mt-2 text-sm text-neutral-600">{TRIBE_ARCHIVED_BODY}</p>
        </div>
      ) : null}

      {showPrivateGate ? (
        <div className="mb-8 rounded-xl border border-dashed border-yunicity-border bg-yunicity-surface px-6 py-8">
          <h2 className="font-semibold text-neutral-900">{TRIBE_PRIVATE_TITLE}</h2>
          <p className="mt-2 text-sm text-neutral-600">{TRIBE_PRIVATE_BODY}</p>
        </div>
      ) : null}

      {!showPrivateGate ? (
        <>
          <TribeModerationPanel tribe={tribe} city={city} />
          <TribeWallSection tribe={tribe} city={city} />
          <TribeMembersSection tribe={tribe} city={city} />
        </>
      ) : null}
    </WebAppShell>
  );
}
