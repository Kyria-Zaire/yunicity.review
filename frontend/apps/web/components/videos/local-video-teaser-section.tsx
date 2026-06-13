"use client";

import {
  LOCAL_VIDEO_TEASER_SECTION_EVENT,
  LOCAL_VIDEO_TEASER_SECTION_FEED,
  LOCAL_VIDEO_TEASER_SECTION_NEIGHBORHOOD,
  LOCAL_VIDEO_TEASER_SECTION_PLACE,
  type LocalVideoTeaserFilter,
} from "@yunicity/utils";

import { LocalVideoTeaserRail } from "@/components/videos/local-video-teaser-rail";
import { useLocalVideoTeasers } from "@/hooks/use-local-video-teasers";

type LocalVideoTeaserSectionProps = {
  city?: string;
  filter: LocalVideoTeaserFilter;
  title?: string;
  layout?: "stack" | "scroll";
  enabled?: boolean;
};

function resolveDefaultTitle(filter: LocalVideoTeaserFilter): string {
  switch (filter.kind) {
    case "place":
      return LOCAL_VIDEO_TEASER_SECTION_PLACE;
    case "neighborhood":
      return LOCAL_VIDEO_TEASER_SECTION_NEIGHBORHOOD;
    case "event":
      return LOCAL_VIDEO_TEASER_SECTION_EVENT;
    case "city":
    default:
      return LOCAL_VIDEO_TEASER_SECTION_FEED;
  }
}

export function LocalVideoTeaserSection({
  city,
  filter,
  title,
  layout = "stack",
  enabled = true,
}: LocalVideoTeaserSectionProps) {
  const teasers = useLocalVideoTeasers({ city, filter, enabled });

  if (teasers.isLoading || teasers.isEmpty) return null;

  return (
    <LocalVideoTeaserRail
      items={teasers.items}
      title={title ?? resolveDefaultTitle(filter)}
      layout={layout}
    />
  );
}
