"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_SOCIAL_PROOF_LABEL,
  formatVideoAuthorDisplayName,
  formatVideoContextLine,
  shouldShowLocalVideoSocialProof,
} from "@yunicity/utils";

export function LocalVideoMetaStrip({ item }: { item: LocalVideoFeedItem }) {
  const title =
    item.title?.trim() || item.cultural_place_name?.trim() || item.description?.trim();
  const showSocialProof = shouldShowLocalVideoSocialProof(item);

  return (
    <div className="space-y-1 text-white">
      <p className="text-sm font-semibold">{formatVideoAuthorDisplayName(item)}</p>
      {title ? (
        <p className="text-base font-bold leading-snug drop-shadow-sm">{title}</p>
      ) : null}
      {item.neighborhood_name ? (
        <p className="text-sm font-medium text-white/90">{item.neighborhood_name}</p>
      ) : null}
      <p className="text-sm font-medium text-white/85">{formatVideoContextLine(item)}</p>
      {showSocialProof ? (
        <p className="pt-0.5 text-xs italic text-white/60">{LOCAL_VIDEO_SOCIAL_PROOF_LABEL}</p>
      ) : null}
    </div>
  );
}
