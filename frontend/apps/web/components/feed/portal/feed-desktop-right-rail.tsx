"use client";

import type { LocalEvent, Tribe } from "@yunicity/types";
import Link from "next/link";

import { FeedMemberTribes } from "@/components/feed/portal/feed-member-tribes";
import { FeedPassportCard } from "@/components/feed/portal/feed-passport-card";
import { FeedTonightEvents } from "@/components/feed/portal/feed-tonight-events";
import { hasRightRailContent } from "@/lib/feed/feed-right-rail-modules";

/**
 * D1.2 — rail droit Desktop (>=1536px), troisieme enfant reel du groupe Feed.
 *
 * Contrats :
 * - aucune requete : tout derive de `useFeedPortalContext`, deja monte ;
 * - aucun aside si aucun module n'a de contenu reel — les 320px ne sont pas
 *   reserves, le groupe reste a 1008px et centre ;
 * - le footer legal ne liste que des routes qui existent reellement.
 *
 * La visibilite par breakpoint est portee par la CSS (`.feed-right-rail`),
 * jamais par du JavaScript.
 */
export function FeedDesktopRightRail({
  tonightEvents,
  memberTribes,
  city,
}: {
  tonightEvents: LocalEvent[];
  memberTribes: Tribe[];
  city: string;
}) {
  if (!hasRightRailContent({ tonightEvents, memberTribes })) return null;

  return (
    <aside
      data-feed-right-rail=""
      className="feed-right-rail min-w-0"
      aria-label="Informations contextuelles"
    >
      <div className="space-y-4">
        <FeedTonightEvents events={tonightEvents} city={city} />
        {/* D1.2-R3A — Passport reel, active par visibilite. Son slot ne
            reserve aucune place tant qu'il n'a pas de contenu. */}
        <FeedPassportCard />
        <FeedMemberTribes tribes={memberTribes} />

        <footer className="px-1 text-xs text-neutral-500">
          <nav aria-label="Informations légales">
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              <li>
                <Link
                  href="/legal/confidentialite"
                  className="rounded hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
                >
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/conditions-generales"
                  className="rounded hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
                >
                  Conditions
                </Link>
              </li>
            </ul>
          </nav>
          <p className="mt-2">© {new Date().getFullYear()} Yunicity</p>
        </footer>
      </div>
    </aside>
  );
}
