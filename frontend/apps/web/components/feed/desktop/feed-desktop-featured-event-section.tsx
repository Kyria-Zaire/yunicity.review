"use client";

import type { LocalEvent } from "@yunicity/types";

import { selectFeedFeaturedEvent } from "@/lib/feed/feed-featured-event";

import { FeedDesktopFeaturedEventCard } from "./feed-desktop-featured-event-card";

type FeedDesktopFeaturedEventSectionProps = {
  events: readonly LocalEvent[];
  className?: string;
};

/** Bandeau événement éditorial desktop — sans marqueur de région medium. */
export function FeedDesktopFeaturedEventSection({
  events,
  className = "",
}: FeedDesktopFeaturedEventSectionProps) {
  const featuredEvent = selectFeedFeaturedEvent(events);
  if (!featuredEvent) return null;

  return (
    <div className={className}>
      <FeedDesktopFeaturedEventCard event={featuredEvent} />
    </div>
  );
}
