"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { ProfileAvatar } from "@/components/profile-avatar";
import type { TribeDetailPostCard } from "@yunicity/utils";
import {
  TRIBE_DETAIL_MOBILE_DISCUSSIONS_EMPTY,
  TRIBE_DETAIL_MOBILE_DISCUSSIONS_GUEST,
  TRIBE_DETAIL_MOBILE_DISCUSSIONS_TITLE,
  TRIBE_DETAIL_MOBILE_DISCUSSIONS_VIEW,
} from "@yunicity/utils";
import { Bookmark } from "lucide-react";
import Link from "next/link";

type TribeDetailMobileDiscussionsSectionProps = {
  posts: TribeDetailPostCard[];
  canSeePosts: boolean;
};

export function TribeDetailMobileDiscussionsSection({
  posts,
  canSeePosts,
}: TribeDetailMobileDiscussionsSectionProps) {
  return (
    <section
      id="tribe-mobile-discussions"
      className="tribe-detail-section space-y-3"
      data-tribe-detail-mobile-discussions=""
    >
      <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_MOBILE_DISCUSSIONS_TITLE}</h2>

      {!canSeePosts ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-600">
          {TRIBE_DETAIL_MOBILE_DISCUSSIONS_GUEST}
        </p>
      ) : posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-600">
          {TRIBE_DETAIL_MOBILE_DISCUSSIONS_EMPTY}
        </p>
      ) : (
        <ul className="space-y-4">
          {posts.slice(0, 4).map((post) => (
            <li key={post.id}>
              <article className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
                <div className="p-4">
                  <div className="flex items-start gap-2.5">
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
                  <div className="relative aspect-[16/10] bg-neutral-100">
                    <CulturalImage
                      src={post.imageUrl}
                      alt=""
                      placeName={post.authorLabel}
                      className="size-full object-cover"
                      sizes="100vw"
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
                    {TRIBE_DETAIL_MOBILE_DISCUSSIONS_VIEW}
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
