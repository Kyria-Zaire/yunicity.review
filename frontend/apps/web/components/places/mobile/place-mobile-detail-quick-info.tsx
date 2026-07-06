"use client";

import type { PlaceMobileDetailQuickInfoItem } from "@yunicity/utils";
import { Globe, MapPin, Navigation, Users } from "lucide-react";
import Link from "next/link";

type PlaceMobileDetailQuickInfoProps = {
  items: PlaceMobileDetailQuickInfoItem[];
};

const ICONS = {
  address: MapPin,
  website: Globe,
  neighborhood: Users,
  route: Navigation,
} as const;

const TONES = {
  address: "text-violet-600 bg-violet-50",
  website: "text-orange-600 bg-orange-50",
  neighborhood: "text-sky-600 bg-sky-50",
  route: "text-yunicity-primary bg-yunicity-primary-soft",
} as const;

/** Grille infos pratiques détail lieu mobile (MOBILE-LIEUX-02). */
export function PlaceMobileDetailQuickInfo({ items }: PlaceMobileDetailQuickInfoProps) {
  if (items.length === 0) return null;

  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm"
      aria-label="Informations pratiques"
    >
      <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100 sm:grid-cols-4">
        {items.map((item) => {
          const Icon = ICONS[item.key];
          const tone = TONES[item.key];
          const content = (
            <>
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="mt-2 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                {item.label}
              </span>
              <span className="mt-0.5 line-clamp-2 text-xs font-semibold text-neutral-900">
                {item.value}
              </span>
            </>
          );

          return item.href ? (
            <Link
              key={item.key}
              href={item.href}
              target={item.key === "website" ? "_blank" : undefined}
              rel={item.key === "website" ? "noopener noreferrer" : undefined}
              className="flex min-h-[6.5rem] flex-col p-3 transition hover:bg-neutral-50"
            >
              {content}
            </Link>
          ) : (
            <div key={item.key} className="flex min-h-[6.5rem] flex-col p-3">
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
