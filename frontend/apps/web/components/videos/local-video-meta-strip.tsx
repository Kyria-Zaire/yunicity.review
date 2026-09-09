"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_SOCIAL_PROOF_LABEL,
  formatVideoAuthorDisplayName,
  formatVideoContextLine,
  resolveVideoRankingReason,
  shouldShowLocalVideoSocialProof,
} from "@yunicity/utils";

export function LocalVideoMetaStrip({ item }: { item: LocalVideoFeedItem }) {
  const title =
    item.title?.trim() || item.cultural_place_name?.trim() || item.description?.trim();
  const showSocialProof = shouldShowLocalVideoSocialProof(item);
  // VIDEO-03 — motif du classement, decide par l'API. Le frontend ne
  // reconstruit rien : il affiche, ou n'affiche pas.
  const raison = resolveVideoRankingReason(item);

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
      {raison.visible ? (
        // Lisible par les lecteurs d'ecran sans etre intrusif : c'est une
        // precision sur le contexte, pas une alerte — donc pas de role="status",
        // qui interromprait la lecture a chaque changement de slide.
        <p
          className={`pt-0.5 text-xs ${
            raison.emphasis ? "font-medium text-white/85" : "text-white/70"
          }`}
        >
          {raison.label}
        </p>
      ) : null}
      {showSocialProof ? (
        <p className="pt-0.5 text-xs italic text-white/60">{LOCAL_VIDEO_SOCIAL_PROOF_LABEL}</p>
      ) : null}
    </div>
  );
}
