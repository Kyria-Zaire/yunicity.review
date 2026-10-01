"use client";

import type { PublicHomeMobileExploreItem } from "@/lib/marketing/public-home-contract";
import { ChevronRight, Home, MapPin, Store, Users } from "lucide-react";
import Link from "next/link";

const ROW_STYLES: Record<
  PublicHomeMobileExploreItem["id"],
  { iconWrap: string; iconColor: string }
> = {
  neighborhoods: {
    iconWrap: "bg-blue-50",
    iconColor: "text-yunicity-primary",
  },
  tribes: {
    iconWrap: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  places: {
    iconWrap: "bg-violet-50",
    iconColor: "text-violet-600",
  },
};

function RowIcon({ icon }: { icon: PublicHomeMobileExploreItem["icon"] }) {
  const className = "h-5 w-5";
  if (icon === "neighborhoods") return <MapPin className={className} aria-hidden />;
  if (icon === "tribes") return <Users className={className} aria-hidden />;
  if (icon === "places") return <Store className={className} aria-hidden />;
  return <Home className={className} aria-hidden />;
}

type PublicHomeMobileExploreRowProps = {
  item: PublicHomeMobileExploreItem;
};

export function PublicHomeMobileExploreRow({ item }: PublicHomeMobileExploreRowProps) {
  const styles = ROW_STYLES[item.id];

  return (
    <li>
      <Link
        href={item.href}
        aria-label={item.title}
        data-public-home-control={`preview-${item.id}`}
        className="flex min-h-11 items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3 shadow-sm transition hover:border-yunicity-primary/20 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
      >
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.iconWrap} ${styles.iconColor}`}
        >
          <RowIcon icon={item.icon} />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-base font-bold text-neutral-950">{item.title}</span>
          <span className="mt-0.5 block text-sm text-neutral-500">{item.subtitle}</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
      </Link>
    </li>
  );
}
