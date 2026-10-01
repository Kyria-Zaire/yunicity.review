"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { PublicationMediaFrame } from "@/components/feed/publication-media-frame";
import type { PartnerCreatorContentPublic } from "@yunicity/types";
import {
  formatPartnerCreatorContentExcerpt,
  formatPartnerCreatorContentPublishedAt,
  hasPartnerCreatorContentMedia,
  PARTNER_DETAIL_CREATOR_CONTENT_PUBLISHED_LABEL,
} from "@yunicity/utils";

type PartnerCreatorContentCardProps = {
  item: PartnerCreatorContentPublic;
  partnerName: string;
};

export function PartnerCreatorContentCard({ item, partnerName }: PartnerCreatorContentCardProps) {
  const excerpt = formatPartnerCreatorContentExcerpt(item.body);
  const publishedLabel = formatPartnerCreatorContentPublishedAt(item.published_at);
  const showMedia = hasPartnerCreatorContentMedia(item);

  return (
    <article className="overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50/60">
      {showMedia && item.media_url ? (
        // Publication SECONDAIRE : le cadre canonique porte le ratio et le
        // plafond. La source d'image reste `CulturalImage` — contenu partenaire,
        // pipeline public distinct de l'accès autorisé des publications.
        <PublicationMediaFrame
          variant="compact"
          kind="image"
          orientation="landscape"
          feedPublicationMarker={false}
          className="bg-neutral-200"
        >
          <CulturalImage
            src={item.media_url}
            alt={item.title}
            placeName={partnerName}
            className="publication-media-frame__media"
            sizes="(max-width: 1100px) 100vw, 400px"
          />
        </PublicationMediaFrame>
      ) : null}
      <div className="px-4 py-3">
        <h3 className="font-semibold text-neutral-900">{item.title}</h3>
        {publishedLabel ? (
          <p className="mt-0.5 text-xs font-medium text-yunicity-primary">
            {PARTNER_DETAIL_CREATOR_CONTENT_PUBLISHED_LABEL} {publishedLabel}
          </p>
        ) : null}
        {excerpt ? <p className="mt-2 text-sm leading-relaxed text-neutral-600">{excerpt}</p> : null}
      </div>
    </article>
  );
}
