"use client";

import type { Tribe } from "@yunicity/types";
import {
  TRIBE_COMPOSER_PLACEHOLDER,
  TRIBE_WALL_EMPTY,
  TRIBE_WALL_MEMBERS_ONLY,
  TRIBE_PUBLISH_CTA,
  TRIBE_WALL_TITLE,
  TRIBE_WALL_CONTEXT_BADGE,
} from "@yunicity/utils";
import { useEffect } from "react";

import { FeedCard } from "@/components/feed/feed-card";
import { FeedComposer } from "@/components/feed/feed-composer";
import { useTribeWall } from "@/hooks/use-tribe-wall";
import { canModerateTribe } from "@/hooks/use-tribe-members";

export function TribeWallSection({ tribe, city }: { tribe: Tribe; city: string }) {
  const enabled = tribe.viewer_is_member && !tribe.is_archived;
  const wall = useTribeWall(tribe.slug, city, enabled);
  const canModerate = canModerateTribe(tribe.viewer_role);

  useEffect(() => {
    if (enabled) {
      void wall.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh on membership/city only
  }, [enabled, tribe.slug, city]);

  if (!tribe.viewer_is_member) {
    return (
      <section className="rounded-xl border border-dashed border-yunicity-border bg-yunicity-surface px-6 py-8">
        <p className="text-sm text-neutral-600">{TRIBE_WALL_MEMBERS_ONLY}</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-neutral-900">{TRIBE_WALL_TITLE}</h2>
        <span className="rounded-full bg-yunicity-surface px-3 py-1 text-xs text-neutral-600">
          {TRIBE_WALL_CONTEXT_BADGE}
        </span>
      </div>

      {enabled ? (
        <FeedComposer
          placeholder={TRIBE_COMPOSER_PLACEHOLDER}
          submitLabel={TRIBE_PUBLISH_CTA}
          onSubmit={async (body, mediaUrl) => {
            await wall.createPost(body, mediaUrl);
          }}
        />
      ) : null}

      {wall.loading ? (
        <p className="text-sm text-neutral-500">Chargement du mur…</p>
      ) : null}
      {wall.error ? <p className="text-sm text-red-700">{wall.error}</p> : null}

      {!wall.loading && wall.items.length === 0 ? (
        <p className="text-sm text-neutral-500">{TRIBE_WALL_EMPTY}</p>
      ) : null}

      <ul className="space-y-4">
        {wall.items.map((post) => (
          <li key={post.id}>
            <FeedCard
              post={post}
              onToggleLike={(item) => wall.toggleLike(item)}
              onReport={(postId, reason) => wall.reportPost(postId, reason)}
            />
            {canModerate ? (
              <button
                type="button"
                onClick={() => void wall.deletePost(post.id)}
                className="mt-2 text-xs text-neutral-500 hover:text-red-700"
              >
                Retirer cette publication
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {wall.nextCursor ? (
        <button
          type="button"
          onClick={() => wall.loadMore()}
          disabled={wall.loadingMore}
          className="w-full rounded-full border border-neutral-300 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          {wall.loadingMore ? "Chargement…" : "Publications plus anciennes"}
        </button>
      ) : null}
    </section>
  );
}
