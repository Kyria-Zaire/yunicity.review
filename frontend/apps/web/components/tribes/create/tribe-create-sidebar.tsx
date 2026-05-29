"use client";

import type { Tribe } from "@yunicity/types";
import {
  TRIBE_CREATE_SIDEBAR_EXAMPLES,
  TRIBE_CREATE_SIDEBAR_GOOD_TO_KNOW,
  TRIBE_CREATE_SIDEBAR_GOOD_TO_KNOW_BODY,
  TRIBE_CREATE_SIDEBAR_TIPS,
  TRIBE_CREATE_SIDEBAR_TIPS_BODY,
  TRIBES_PORTAL_MEMBERS_LABEL,
  tribeCategoryLabel,
  tribeHref,
} from "@yunicity/utils";
import { Lightbulb, Sparkles, Users } from "lucide-react";
import Link from "next/link";

type TribeCreateSidebarProps = {
  exampleTribes: Tribe[];
  city: string;
};

export function TribeCreateSidebar({ exampleTribes, city }: TribeCreateSidebarProps) {
  return (
    <aside className="hidden w-72 shrink-0 xl:block">
      <div className="sticky top-24 space-y-6">
        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yunicity-primary" aria-hidden />
            <h2 className="text-base font-bold text-neutral-900">{TRIBE_CREATE_SIDEBAR_TIPS}</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">
            {TRIBE_CREATE_SIDEBAR_TIPS_BODY}
          </p>
        </section>

        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-yunicity-primary" aria-hidden />
            <h2 className="text-base font-bold text-neutral-900">{TRIBE_CREATE_SIDEBAR_EXAMPLES}</h2>
          </div>
          {exampleTribes.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {exampleTribes.map((tribe) => (
                <li key={tribe.id}>
                  <Link
                    href={tribeHref(tribe.slug, city)}
                    className="block rounded-xl border border-neutral-100 px-3 py-2.5 transition hover:border-yunicity-primary/30 hover:bg-neutral-50"
                  >
                    <p className="text-sm font-semibold text-neutral-900">{tribe.name}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {tribeCategoryLabel(tribe.category)} ·{" "}
                      {TRIBES_PORTAL_MEMBERS_LABEL(tribe.active_member_count)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">Aucune tribu disponible pour le moment.</p>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yunicity-primary" aria-hidden />
            <h2 className="text-base font-bold text-neutral-900">{TRIBE_CREATE_SIDEBAR_GOOD_TO_KNOW}</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">
            {TRIBE_CREATE_SIDEBAR_GOOD_TO_KNOW_BODY}
          </p>
        </section>
      </div>
    </aside>
  );
}
