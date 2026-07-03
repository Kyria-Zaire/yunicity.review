"use client";

import type { PartnerPublic } from "@yunicity/types";
import {
  MAP_PARTNER_GEO_NOTICE,
  MAP_PORTAL_DETAIL_CLOSE,
  MAP_PORTAL_PARTNER_SEE_PROFILE,
  MAP_PORTAL_PARTNER_TAG,
  hasPartnerCoordinates,
  partnerBadgeLabel,
  partnerContactActions,
  partnerDisplayCategory,
  partnerPublicHref,
  resolvePartnerImage,
} from "@yunicity/utils";
import { ExternalLink, X } from "lucide-react";
import { MapMediaThumbnail } from "@/components/map/map-media-thumbnail";
import Link from "next/link";

type MapPartnerDetailPanelProps = {
  partner: PartnerPublic;
  onClose: () => void;
};

export function MapPartnerDetailPanel({
  partner,
  onClose,
}: MapPartnerDetailPanelProps) {
  const imageUrl = resolvePartnerImage(partner, "card");
  const actions = partnerContactActions(partner);
  const canRoute = hasPartnerCoordinates(partner);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-lg">
      <div className="flex justify-end p-2">
        <button
          type="button"
          onClick={onClose}
          aria-label={MAP_PORTAL_DETAIL_CLOSE}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {imageUrl ? (
        <div className="relative h-36 bg-neutral-100">
          <MapMediaThumbnail src={imageUrl} className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="space-y-4 p-4">
        <div>
          <span className="rounded-full bg-yunicity-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yunicity-primary">
            {MAP_PORTAL_PARTNER_TAG}
          </span>
          <h2 className="mt-2 text-xl font-bold text-neutral-900">{partner.name}</h2>
          <p className="mt-1 text-sm text-neutral-600">{partnerDisplayCategory(partner)}</p>
          <span className="mt-2 inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">
            {partnerBadgeLabel(partner.partner_status)}
          </span>
        </div>

        {!canRoute ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {MAP_PARTNER_GEO_NOTICE}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Link
            href={partnerPublicHref(partner)}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-800 transition hover:border-yunicity-primary/30"
          >
            {MAP_PORTAL_PARTNER_SEE_PROFILE}
          </Link>
        </div>

        {partner.address ? (
          <p className="text-sm text-neutral-600">{partner.address}</p>
        ) : null}

        <ul className="space-y-2">
          {actions
            .filter((action) => action.id !== "map")
            .map((action) => (
              <li key={action.id}>
                {action.disabled || !action.href ? (
                  <span className="text-xs text-neutral-400">{action.label}</span>
                ) : (
                  <a
                    href={action.href}
                    target={action.external ? "_blank" : undefined}
                    rel={action.external ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-yunicity-primary hover:underline"
                  >
                    {action.label}
                    {action.external ? (
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    ) : null}
                  </a>
                )}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
