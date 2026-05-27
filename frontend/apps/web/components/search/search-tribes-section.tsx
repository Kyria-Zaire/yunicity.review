"use client";

import { TribeDiscoveryCard } from "@/components/search/tribe-discovery-card";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type { Tribe } from "@yunicity/types";
import {
  SEARCH_EXPLORER_TRIBES_EMPTY,
  TRIBE_INVITATION_CTA,
  tribeDiscoveryActionLabel,
  tribeHref,
} from "@yunicity/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type SearchTribesSectionProps = {
  tribes: Tribe[];
  city: string;
  title?: string;
  subtitle?: string;
  maxItems?: number;
  compact?: boolean;
};

export function SearchTribesSection({
  tribes,
  city,
  title = "Trouvez votre cercle local",
  subtitle = "Des groupes locaux pour agir, sortir, apprendre ou créer ensemble.",
  maxItems = 6,
  compact = false,
}: SearchTribesSectionProps) {
  const api = useYunicityApi();
  const router = useRouter();
  const [items, setItems] = useState<Tribe[]>(tribes);
  const [joiningBySlug, setJoiningBySlug] = useState<Record<string, boolean>>({});
  const [errorBySlug, setErrorBySlug] = useState<Record<string, string>>({});

  useEffect(() => {
    setItems(tribes);
  }, [tribes]);

  const visible = useMemo(() => {
    const clean = items.filter((tribe) => !tribe.is_archived);
    const publicFirst = clean.filter((tribe) => tribe.visibility === "public");
    const inviteOnly = clean.filter((tribe) => tribe.visibility !== "public");
    return [...publicFirst, ...inviteOnly].slice(0, maxItems);
  }, [items, maxItems]);

  const runJoin = async (tribe: Tribe) => {
    if (tribe.viewer_is_member || tribe.visibility === "private_invite") {
      router.push(tribeHref(tribe.slug, city));
      return;
    }
    setJoiningBySlug((prev) => ({ ...prev, [tribe.slug]: true }));
    setErrorBySlug((prev) => ({ ...prev, [tribe.slug]: "" }));
    try {
      await api.tribes.joinTribe(tribe.slug, city, { charter_accepted: true });
      setItems((prev) =>
        prev.map((item) =>
          item.slug === tribe.slug
            ? { ...item, viewer_is_member: true, active_member_count: item.active_member_count + 1 }
            : item,
        ),
      );
      router.push(tribeHref(tribe.slug, city));
    } catch {
      setErrorBySlug((prev) => ({
        ...prev,
        [tribe.slug]: "Impossible de rejoindre la tribu pour le moment.",
      }));
    } finally {
      setJoiningBySlug((prev) => ({ ...prev, [tribe.slug]: false }));
    }
  };

  return (
    <section className="space-y-3" aria-labelledby="search-tribes-title">
      <div className="flex items-end justify-between gap-3">
        <h2 id="search-tribes-title" className="text-base font-semibold text-neutral-900">
          {title}
        </h2>
        <Link href="/tribes" className="text-xs font-semibold text-yunicity-primary hover:underline">
          Voir toutes les tribus
        </Link>
      </div>
      <p className="text-sm text-neutral-500">{subtitle}</p>
      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
          {SEARCH_EXPLORER_TRIBES_EMPTY}
        </p>
      ) : (
        <ul className={compact ? "grid gap-3 md:grid-cols-2 lg:grid-cols-3" : "grid gap-4 md:grid-cols-2"}>
          {visible.map((tribe) => (
            <li key={tribe.id} className="space-y-2">
              <TribeDiscoveryCard
                tribe={tribe}
                compact={compact}
                actionLabel={tribeDiscoveryActionLabel(tribe)}
                disabled={joiningBySlug[tribe.slug]}
                onAction={() => void runJoin(tribe)}
              />
              {tribeDiscoveryActionLabel(tribe) === TRIBE_INVITATION_CTA ? (
                <p className="text-xs text-neutral-500">Cette tribu est accessible sur invitation.</p>
              ) : null}
              {errorBySlug[tribe.slug] ? (
                <p className="text-xs text-red-700">{errorBySlug[tribe.slug]}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
