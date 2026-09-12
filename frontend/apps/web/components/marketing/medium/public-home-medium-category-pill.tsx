"use client";

import type { PublicHomeFeature } from "@/lib/marketing/public-home-contract";
import { Home, MapPin, Store, Users } from "lucide-react";
import Link from "next/link";

const PILL_STYLES: Record<
  PublicHomeFeature["id"],
  { iconWrap: string; iconColor: string }
> = {
  neighborhoods: {
    iconWrap: "bg-blue-50",
    iconColor: "text-yunicity-primary",
  },
  tribes: {
    iconWrap: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  places: {
    iconWrap: "bg-teal-50",
    iconColor: "text-teal-600",
  },
};

function PillIcon({ icon }: { icon: PublicHomeFeature["icon"] }) {
  const className = "h-4 w-4";
  if (icon === "neighborhoods") return <MapPin className={className} aria-hidden />;
  if (icon === "tribes") return <Users className={className} aria-hidden />;
  if (icon === "places") return <Store className={className} aria-hidden />;
  return <Home className={className} aria-hidden />;
}

type PublicHomeMediumCategoryPillProps = {
  feature: PublicHomeFeature;
  className?: string;
};

export function PublicHomeMediumCategoryPill({
  feature,
  className = "",
}: PublicHomeMediumCategoryPillProps) {
  const styles = PILL_STYLES[feature.id];

  return (
    <Link
      href={feature.href}
      data-public-home-control={`feature-${feature.id}`}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-neutral-200/90 bg-white px-3 py-2 shadow-md transition hover:shadow-lg ${className}`}
    >
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${styles.iconWrap} ${styles.iconColor}`}
      >
        <PillIcon icon={feature.icon} />
      </span>
      <span className="h-4 w-px bg-neutral-200" aria-hidden />
      <span className="pr-1 text-sm font-semibold text-neutral-900">{feature.title}</span>
    </Link>
  );
}
