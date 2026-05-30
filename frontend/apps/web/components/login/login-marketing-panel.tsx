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
  LOGIN_MARKETING_TITLE,
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
    iconClassName: "bg-violet-50 text-violet-600",
    title: LOGIN_MARKETING_CONNECTED_TITLE,
    body: LOGIN_MARKETING_CONNECTED_BODY,
  },
  {
    icon: CalendarDays,
    iconClassName: "bg-emerald-50 text-emerald-600",
    title: LOGIN_MARKETING_DISCOVER_TITLE,
    body: LOGIN_MARKETING_DISCOVER_BODY,
  },
  {
    icon: Store,
    iconClassName: "bg-orange-50 text-orange-600",
    title: LOGIN_MARKETING_LOCAL_TITLE,
    body: LOGIN_MARKETING_LOCAL_BODY,
  },
  {
    icon: HandHeart,
    iconClassName: "bg-sky-50 text-sky-600",
    title: LOGIN_MARKETING_SECURE_TITLE,
    body: LOGIN_MARKETING_SECURE_BODY,
  },
];

export function LoginMarketingPanel() {
  return (
    <aside className="flex flex-col bg-[#EEF0FF] p-8 sm:p-10 lg:p-12">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <h2 className="text-xl font-bold leading-snug text-neutral-900 sm:text-2xl">
          {LOGIN_MARKETING_TITLE}
        </h2>

        <ul className="mt-8 space-y-5">
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

        <div className="mt-auto pt-8">
          <div className="overflow-hidden rounded-2xl bg-white/70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1590333748338-d629e4564ad9?w=700&auto=format&fit=crop&q=60"
              alt=""
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
