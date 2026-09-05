"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  VIDEO_DETAIL_AUTOPLAY,
  VIDEO_DETAIL_CATEGORY,
  VIDEO_DETAIL_DETAILS_TITLE,
  VIDEO_DETAIL_DURATION,
  VIDEO_DETAIL_LICENSE,
  VIDEO_DETAIL_LICENSE_VALUE,
  VIDEO_DETAIL_LOCATION,
  VIDEO_DETAIL_PUBLISHED,
  VIDEO_DETAIL_REPORT,
  VIDEO_DETAIL_SEE_MORE,
  VIDEO_DETAIL_SIDEBAR_TITLE,
  formatLocalVideoDuration,
  formatVideoDetailCategory,
  formatVideoDetailLocation,
  formatVideoDetailPublishedAt,
  pickRelatedVideos,
} from "@yunicity/utils";
import Link from "next/link";

import { VideoDetailRelatedCard } from "@/components/videos/video-detail-related-card";
import { VIDEO_CANVAS_FOCUS, VIDEO_TOUCH_TARGET } from "@/lib/videos/video-playback-a11y";

type VideoDetailSidebarProps = {
  video: LocalVideoFeedItem;
  items: readonly LocalVideoFeedItem[];
  autoplayEnabled: boolean;
  onAutoplayChange: (enabled: boolean) => void;
  onOpenReport: () => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium text-neutral-900">{value}</dd>
    </div>
  );
}

export function VideoDetailSidebar({
  video,
  items,
  autoplayEnabled,
  onAutoplayChange,
  onOpenReport,
}: VideoDetailSidebarProps) {
  const related = pickRelatedVideos(items, video.id, 4);

  return (
    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-neutral-900">{VIDEO_DETAIL_SIDEBAR_TITLE}</h2>
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600">
            <span id="video-detail-autoplay-label">{VIDEO_DETAIL_AUTOPLAY}</span>
            <button
              type="button"
              role="switch"
              aria-checked={autoplayEnabled}
              aria-labelledby="video-detail-autoplay-label"
              onClick={() => onAutoplayChange(!autoplayEnabled)}
              className={`${VIDEO_TOUCH_TARGET} rounded-full ${VIDEO_CANVAS_FOCUS}`}
            >
              <span
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition motion-reduce:transition-none ${
                  autoplayEnabled ? "bg-yunicity-primary" : "bg-neutral-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition motion-reduce:transition-none ${
                    autoplayEnabled ? "left-[1.35rem]" : "left-0.5"
                  }`}
                />
              </span>
            </button>
          </label>
        </div>

        <div className="space-y-1">
          {related.map((item) => (
            <VideoDetailRelatedCard key={item.id} item={item} />
          ))}
        </div>

        <Link
          href="/videos"
          className="mt-4 flex w-full items-center justify-center rounded-full bg-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-200"
        >
          {VIDEO_DETAIL_SEE_MORE}
        </Link>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900">{VIDEO_DETAIL_DETAILS_TITLE}</h2>
        <dl className="mt-2 divide-y divide-neutral-100">
          <DetailRow label={VIDEO_DETAIL_CATEGORY} value={formatVideoDetailCategory(video)} />
          <DetailRow label={VIDEO_DETAIL_LOCATION} value={formatVideoDetailLocation(video)} />
          <DetailRow
            label={VIDEO_DETAIL_PUBLISHED}
            value={formatVideoDetailPublishedAt(video.published_at ?? video.created_at)}
          />
          <DetailRow
            label={VIDEO_DETAIL_DURATION}
            value={formatLocalVideoDuration(video.duration_seconds)}
          />
          <DetailRow label={VIDEO_DETAIL_LICENSE} value={VIDEO_DETAIL_LICENSE_VALUE} />
        </dl>
        <button
          type="button"
          onClick={onOpenReport}
          aria-label={VIDEO_DETAIL_REPORT}
          className={`mt-4 text-sm font-semibold text-yunicity-primary hover:underline ${VIDEO_CANVAS_FOCUS}`}
        >
          {VIDEO_DETAIL_REPORT}
        </button>
      </section>
    </aside>
  );
}
