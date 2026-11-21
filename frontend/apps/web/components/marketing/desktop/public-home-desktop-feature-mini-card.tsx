"use client";

import type { PublicHomeFeature } from "@/lib/marketing/public-home-contract";
import { Home, Store, Users } from "lucide-react";
import Link from "next/link";

const TONE_CLASSES: Record<
  PublicHomeFeature["tone"],
  { icon: string; iconColor: string }
> = {
  pink: {
    icon: "bg-[#F43F5E]",
    iconColor: "text-white",
  },
  green: {
    icon: "bg-[#10B981]",
    iconColor: "text-white",
  },
  orange: {
    icon: "bg-[#F59E0B]",
    iconColor: "text-white",
  },
};

function FeatureIcon({ icon }: { icon: PublicHomeFeature["icon"] }) {
  const className = "h-4 w-4";
  if (icon === "neighborhoods") return <Home className={className} aria-hidden />;
  if (icon === "tribes") return <Users className={className} aria-hidden />;
  return <Store className={className} aria-hidden />;
}

type PublicHomeDesktopFeatureMiniCardProps = {
  feature: PublicHomeFeature;
};

export function PublicHomeDesktopFeatureMiniCard({
  feature,
}: PublicHomeDesktopFeatureMiniCardProps) {
  const tone = TONE_CLASSES[feature.tone];

  return (
    <article className="flex h-full flex-col rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-md">
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${tone.icon} ${tone.iconColor}`}
      >
        <FeatureIcon icon={feature.icon} />
      </span>
      <h3 className="mt-3 text-sm font-bold text-neutral-950">{feature.title}</h3>
      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-neutral-600">{feature.body}</p>
      <Link
        href={feature.href}
        data-public-home-control={`feature-${feature.id}`}
        className="mt-auto inline-flex min-h-11 items-center pt-3 text-xs font-semibold text-yunicity-primary hover:underline"
      >
        {feature.linkLabel} →
      </Link>
    </article>
  );
}
