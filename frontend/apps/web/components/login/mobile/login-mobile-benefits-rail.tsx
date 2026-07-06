"use client";

import {
  LOGIN_MARKETING_CONNECTED_BODY,
  LOGIN_MARKETING_CONNECTED_TITLE,
  LOGIN_MARKETING_DISCOVER_BODY,
  LOGIN_MARKETING_DISCOVER_TITLE,
  LOGIN_MARKETING_LOCAL_BODY,
  LOGIN_MARKETING_LOCAL_TITLE,
  LOGIN_MARKETING_SECURE_BODY,
  LOGIN_MARKETING_SECURE_TITLE,
  AUTH_MOBILE_BENEFITS_TITLE,
} from "@yunicity/utils";
import { CalendarDays, HandHeart, Store, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const BENEFITS: {
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  body: string;
}[] = [
  {
    icon: Users,
    iconClassName: "bg-violet-100 text-violet-600",
    title: LOGIN_MARKETING_CONNECTED_TITLE,
    body: LOGIN_MARKETING_CONNECTED_BODY,
  },
  {
    icon: CalendarDays,
    iconClassName: "bg-emerald-100 text-emerald-600",
    title: LOGIN_MARKETING_DISCOVER_TITLE,
    body: LOGIN_MARKETING_DISCOVER_BODY,
  },
  {
    icon: Store,
    iconClassName: "bg-orange-100 text-orange-600",
    title: LOGIN_MARKETING_LOCAL_TITLE,
    body: LOGIN_MARKETING_LOCAL_BODY,
  },
  {
    icon: HandHeart,
    iconClassName: "bg-sky-100 text-sky-600",
    title: LOGIN_MARKETING_SECURE_TITLE,
    body: LOGIN_MARKETING_SECURE_BODY,
  },
];

/** Rail horizontal des bénéfices — login mobile (MOBILE-AUTH-01). */
export function LoginMobileBenefitsRail() {
  return (
    <section aria-label={AUTH_MOBILE_BENEFITS_TITLE} className="px-4 pb-4">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
        {AUTH_MOBILE_BENEFITS_TITLE}
      </h2>
      <ul className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {BENEFITS.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.title}
              className="w-[11.5rem] shrink-0 rounded-2xl border border-neutral-200/90 bg-white p-3.5 shadow-sm"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${item.iconClassName}`}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <p className="mt-2.5 text-sm font-semibold leading-snug text-neutral-900">{item.title}</p>
              <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-neutral-600">{item.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
