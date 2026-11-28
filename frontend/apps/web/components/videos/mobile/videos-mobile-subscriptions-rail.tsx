"use client";

import type { VideoPortalCreator } from "@yunicity/utils";
import {
  VIDEOS_MOBILE_PUBLISH_ARIA,
  VIDEOS_MOBILE_PUBLISH_LABEL,
  VIDEOS_FEED_CREATORS_TITLE,
  buildLocalVideoTeaserHref,
  formatVideoTemporalLabel,
} from "@yunicity/utils";
import { Play, Video } from "lucide-react";
import Link from "next/link";
import { AvatarImage } from "@/components/avatar-image";

const RING_SIZE = "h-[4.25rem] w-[4.25rem]";
const ITEM_WIDTH = "w-[4.75rem]";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "YU";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function CreatorPlayOverlay() {
  return (
    <span className="absolute inset-0 flex items-center justify-center">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm">
        <Play className="h-3.5 w-3.5 fill-neutral-800 text-neutral-800" aria-hidden />
      </span>
    </span>
  );
}

function PublishVideoTile({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label={VIDEOS_MOBILE_PUBLISH_ARIA}
      className={`flex ${ITEM_WIDTH} shrink-0 flex-col items-center gap-1.5`}
    >
      <span
        className={`flex ${RING_SIZE} items-center justify-center rounded-full bg-yunicity-primary text-white shadow-sm transition hover:bg-yunicity-primary-hover`}
      >
        <Video className="h-5 w-5" aria-hidden />
      </span>
      <span className="max-w-full truncate text-center text-[11px] font-semibold text-neutral-900">
        {VIDEOS_MOBILE_PUBLISH_LABEL}
      </span>
    </Link>
  );
}

type VideosMobileSubscriptionsRailProps = {
  creators: VideoPortalCreator[];
};

/**
 * Créateurs du fil — auteurs des vidéos chargées, chacun vers sa dernière vidéo, + CTA publier
 * (MOBILE-VIDEOS-01). VIDEO-REFONTE-L1B : ce ne sont pas des abonnements ; aucun statut de
 * présence n'existe côté API, seule l'ancienneté réelle de la dernière vidéo est affichée.
 */
export function VideosMobileSubscriptionsRail({ creators }: VideosMobileSubscriptionsRailProps) {
  if (creators.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="videos-mobile-subscriptions-title">
      <h2 id="videos-mobile-subscriptions-title" className="text-base font-bold text-neutral-900">
        {VIDEOS_FEED_CREATORS_TITLE}
      </h2>

      <nav
        aria-label={VIDEOS_FEED_CREATORS_TITLE}
        className="-mx-1 overflow-x-auto px-1 pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex min-w-max items-start gap-4">
          <li>
            <PublishVideoTile href="/videos/new" />
          </li>
          {creators.map((creator) => {
            const href = buildLocalVideoTeaserHref(creator.latestVideoId);

            return (
              <li key={creator.authorUserId}>
                <Link href={href} className={`flex ${ITEM_WIDTH} shrink-0 flex-col items-center gap-1.5`}>
                  <div className={`relative rounded-full ${RING_SIZE} bg-neutral-200 p-[2.5px]`}>
                    <div className="relative h-full w-full overflow-hidden rounded-full bg-white p-[3px]">
                      {creator.avatarUrl ? (
                        <AvatarImage
                          src={creator.avatarUrl}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center rounded-full bg-yunicity-primary text-sm font-bold text-white">
                          {initials(creator.displayName)}
                        </span>
                      )}
                      <CreatorPlayOverlay />
                    </div>
                  </div>
                  <span className="max-w-full truncate text-center text-[11px] font-semibold text-neutral-900">
                    {creator.handle}
                  </span>
                  <span className="max-w-full truncate text-center text-[10px] font-medium text-neutral-500">
                    {formatVideoTemporalLabel(creator.latestPublishedAt)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </section>
  );
}
