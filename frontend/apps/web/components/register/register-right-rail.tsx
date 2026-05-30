"use client";

import {
  REGISTER_RAIL_COMMUNITY_BODY,
  REGISTER_RAIL_COMMUNITY_TITLE,
  REGISTER_RAIL_LOCAL_BODY,
  REGISTER_RAIL_LOCAL_TITLE,
  REGISTER_RAIL_SECURE_BODY,
  REGISTER_RAIL_SECURE_TITLE,
  REGISTER_RAIL_TAGLINE,
  REGISTER_RAIL_TAGLINE_SUB,
  REGISTER_RAIL_TERRITORY_BODY,
  REGISTER_RAIL_TERRITORY_TITLE,
  REGISTER_RAIL_TITLE,
} from "@yunicity/utils";
import { HandHeart, MapPin, Megaphone, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const BENEFITS: {
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  body: string;
}[] = [
  {
    icon: Users,
    iconClassName: "bg-violet-50 text-violet-600",
    title: REGISTER_RAIL_COMMUNITY_TITLE,
    body: REGISTER_RAIL_COMMUNITY_BODY,
  },
  {
    icon: MapPin,
    iconClassName: "bg-emerald-50 text-emerald-600",
    title: REGISTER_RAIL_TERRITORY_TITLE,
    body: REGISTER_RAIL_TERRITORY_BODY,
  },
  {
    icon: Megaphone,
    iconClassName: "bg-orange-50 text-orange-600",
    title: REGISTER_RAIL_LOCAL_TITLE,
    body: REGISTER_RAIL_LOCAL_BODY,
  },
  {
    icon: HandHeart,
    iconClassName: "bg-sky-50 text-sky-600",
    title: REGISTER_RAIL_SECURE_TITLE,
    body: REGISTER_RAIL_SECURE_BODY,
  },
];

export function RegisterRightRail() {
  return (
    <aside className="hidden w-72 shrink-0 xl:block">
      <div className="sticky top-8 space-y-5">
        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900">{REGISTER_RAIL_TITLE}</h2>
          <ul className="mt-4 space-y-4">
            {BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.iconClassName}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">{item.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
          <div className="relative aspect-[4/3] bg-yunicity-primary-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1590333748338-d629e4564ad9?w=600&auto=format&fit=crop&q=60"
              alt=""
              className="h-full w-full object-cover opacity-90"
            />
          </div>
          <div className="p-5">
            <p className="text-sm font-bold text-neutral-900">{REGISTER_RAIL_TAGLINE}</p>
            <p className="mt-1 text-sm text-neutral-600">{REGISTER_RAIL_TAGLINE_SUB}</p>
          </div>
        </section>
      </div>
    </aside>
  );
}
