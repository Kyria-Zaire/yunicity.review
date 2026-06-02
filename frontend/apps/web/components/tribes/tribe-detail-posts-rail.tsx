"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribeDetailPostCard } from "@yunicity/utils";
import {
  TRIBE_DETAIL_PORTAL_POSTS_CTA,
  TRIBE_DETAIL_PORTAL_POSTS_EMPTY,
  TRIBE_DETAIL_PORTAL_POSTS_TITLE,
} from "@yunicity/utils";
import Link from "next/link";

type TribeDetailPostsRailProps = {
  posts: TribeDetailPostCard[];
  canSeePosts: boolean;
};

export function TribeDetailPostsRail({ posts, canSeePosts }: TribeDetailPostsRailProps) {
  if (!canSeePosts) return null;

  return (
    <section id="tribe-posts" className="scroll-mt-28 space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg font-bold text-neutral-900">{TRIBE_DETAIL_PORTAL_POSTS_TITLE}</h2>
        {posts.length > 0 ? (
          <a href="#tribe-posts" className="text-sm font-semibold text-yunicity-primary hover:underline">
            {TRIBE_DETAIL_PORTAL_POSTS_CTA} →
          </a>
        ) : null}
      </div>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-6 text-sm text-neutral-600">
          {TRIBE_DETAIL_PORTAL_POSTS_EMPTY}
        </p>
      ) : (
        <ul className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {posts.map((post) => (
            <li key={post.id} className="w-[260px] shrink-0 sm:w-[280px]">
              <article className="flex h-full flex-col rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{post.authorLabel}</p>
                    <p className="text-xs text-neutral-400">{post.timestampLabel}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-neutral-700">{post.body}</p>
                {post.imageUrl ? (
                  <div className="relative mt-3 h-28 overflow-hidden rounded-xl">
                    <CulturalImage
                      src={post.imageUrl}
                      alt=""
                      placeName={post.authorLabel}
                      className="size-full"
                      sizes="280px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                  </div>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
