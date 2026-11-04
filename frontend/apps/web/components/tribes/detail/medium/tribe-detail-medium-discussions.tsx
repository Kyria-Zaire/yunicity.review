"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { ProfileAvatar } from "@/components/profile-avatar";
import type { TribeDetailPostCard } from "@yunicity/utils";
import {
  TRIBE_DETAIL_MEDIUM_DISCUSSIONS_EMPTY,
  TRIBE_DETAIL_MEDIUM_DISCUSSIONS_GUEST,
  TRIBE_DETAIL_MEDIUM_DISCUSSIONS_TITLE,
  TRIBE_DETAIL_MEDIUM_DISCUSSIONS_VIEW,
} from "@yunicity/utils";
import { Bookmark } from "lucide-react";
import Link from "next/link";

type TribeDetailMediumDiscussionsProps = {
  posts: TribeDetailPostCard[];
  canSeePosts: boolean;
};

export function TribeDetailMediumDiscussions({ posts, canSeePosts }: TribeDetailMediumDiscussionsProps) {
  return (
    <section
      id="tribe-medium-discussions"
      className="tribe-detail-section space-y-3"
      data-tribe-detail-medium-discussions=""
    >
      <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_MEDIUM_DISCUSSIONS_TITLE}</h2>

      {!canSeePosts ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-5 py-6 text-sm text-neutral-600">
          {TRIBE_DETAIL_MEDIUM_DISCUSSIONS_GUEST}
        </p>
      ) : posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-5 py-6 text-sm text-neutral-600">
          {TRIBE_DETAIL_MEDIUM_DISCUSSIONS_EMPTY}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {posts.slice(0, 4).map((post) => (
            <li key={post.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
                <div className="p-4">
                  <div className="flex items-start gap-2">
                    <ProfileAvatar name={post.authorLabel} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-neutral-900">{post.authorLabel}</p>
                      <p className="text-xs text-neutral-500">{post.timestampLabel}</p>
                    </div>
                    <Bookmark className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm font-semibold leading-snug text-neutral-900">
                    {post.body}
                  </p>
                </div>
                {post.imageUrl ? (
                  <div className="relative mt-auto aspect-[4/5] max-h-48 bg-neutral-100 sm:max-h-56">
                    <CulturalImage
                      src={post.imageUrl}
                      alt=""
                      placeName={post.authorLabel}
                      className="size-full object-cover"
                      sizes="(max-width: 768px) 50vw, 320px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                  </div>
                ) : null}
                <div className="border-t border-neutral-100 px-4 py-3">
                  <Link
                    href={post.href}
                    className="text-sm font-semibold text-yunicity-primary hover:underline"
                  >
                    {TRIBE_DETAIL_MEDIUM_DISCUSSIONS_VIEW}
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
