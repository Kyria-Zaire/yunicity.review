"use client";

import type { PartnerPublic } from "@yunicity/types";
import {
  MAP_PARTNERS_RAIL_EMPTY,
  MAP_PARTNERS_RAIL_TITLE,
  partnerDisplayCategory,
  partnerPublicHref,
} from "@yunicity/utils";
import Link from "next/link";

type MapPartnersRailProps = {
  partners: PartnerPublic[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
};

export function MapPartnersRail({ partners, selectedSlug, onSelect }: MapPartnersRailProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-neutral-900">{MAP_PARTNERS_RAIL_TITLE}</h3>
      {partners.length === 0 ? (
        <p className="text-xs text-neutral-500">{MAP_PARTNERS_RAIL_EMPTY}</p>
      ) : (
        <ul className="space-y-2">
          {partners.map((partner) => (
            <li key={partner.id}>
              <button
                type="button"
                onClick={() => onSelect(partner.slug)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  selectedSlug === partner.slug
                    ? "border-yunicity-primary bg-yunicity-primary-soft"
                    : "border-neutral-200 bg-white hover:border-yunicity-primary/30"
                }`}
              >
                <p className="text-sm font-semibold text-neutral-900">{partner.name}</p>
                <p className="text-xs text-neutral-500">{partnerDisplayCategory(partner)}</p>
              </button>
              <Link
                href={partnerPublicHref(partner)}
                className="mt-1 inline-block text-xs font-semibold text-yunicity-primary hover:underline"
              >
                Fiche partenaire
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
