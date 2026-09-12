"use client";

import type { PublicHomeExploreCard } from "@/lib/marketing/public-home-contract";
import { Home, Store, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const TONE_CLASSES: Record<
  PublicHomeExploreCard["tone"],
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

function FeatureIcon({ icon }: { icon: PublicHomeExploreCard["icon"] }) {
  const className = "h-5 w-5";
  if (icon === "neighborhoods") return <Home className={className} aria-hidden />;
  if (icon === "tribes") return <Users className={className} aria-hidden />;
  return <Store className={className} aria-hidden />;
}

type PublicHomeDesktopExploreCardProps = {
  card: PublicHomeExploreCard;
};

export function PublicHomeDesktopExploreCard({ card }: PublicHomeDesktopExploreCardProps) {
  const tone = TONE_CLASSES[card.tone];

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[16/10] bg-neutral-100">
        <Image
          src={card.image}
          alt=""
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 33vw"
          loading="lazy"
        />
      </div>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone.icon} ${tone.iconColor}`}
          >
            <FeatureIcon icon={card.icon} />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-neutral-950">{card.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">{card.body}</p>
          </div>
        </div>
        <Link
          href={card.href}
          aria-label={card.title}
          data-public-home-control={`preview-${card.id}`}
          className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {card.linkLabel} →
        </Link>
      </div>
    </article>
  );
}
