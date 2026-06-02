"use client";

import type { TribePortalCategoryId, TribesPortalView } from "@yunicity/utils";
import {
  TRIBES_PORTAL_CATEGORY_LABELS,
  TRIBES_PORTAL_CREATE_CTA,
  TRIBES_PORTAL_CREATE_HREF,
  TRIBES_PORTAL_PAGE_TITLE,
  TRIBES_PORTAL_SIDEBAR_CTA_BODY,
  TRIBES_PORTAL_SIDEBAR_CTA_BUTTON,
  TRIBES_PORTAL_SIDEBAR_CTA_TITLE,
  TRIBES_PORTAL_SUBTITLE,
  TRIBES_PORTAL_VIEW_LABELS,
} from "@yunicity/utils";
import {
  BookOpen,
  CalendarDays,
  Camera,
  GraduationCap,
  Heart,
  Leaf,
  Music,
  Plus,
  Sparkles,
  Star,
  Theater,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type TribesInternalSidebarProps = {
  activeView: TribesPortalView;
  activeCategory: TribePortalCategoryId | "";
  onViewChange: (view: TribesPortalView) => void;
  onCategoryChange: (category: TribePortalCategoryId | "") => void;
  onScrollToMeetups: () => void;
};

type CategoryMeta = {
  id: TribePortalCategoryId;
  icon: LucideIcon;
  tone: string;
};

const CATEGORY_META: CategoryMeta[] = [
  { id: "culture", icon: Theater, tone: "bg-violet-100 text-violet-700" },
  { id: "nature", icon: Leaf, tone: "bg-emerald-100 text-emerald-700" },
  { id: "sport", icon: Sparkles, tone: "bg-sky-100 text-sky-700" },
  { id: "gastronomie", icon: UtensilsCrossed, tone: "bg-orange-100 text-orange-700" },
  { id: "musique", icon: Music, tone: "bg-pink-100 text-pink-700" },
  { id: "photo", icon: Camera, tone: "bg-indigo-100 text-indigo-700" },
  { id: "education", icon: GraduationCap, tone: "bg-amber-100 text-amber-700" },
  { id: "solidarite", icon: Heart, tone: "bg-rose-100 text-rose-700" },
];

const VIEW_ICONS: Record<TribesPortalView, LucideIcon> = {
  all: Users,
  mine: BookOpen,
  featured: Star,
  meetups: CalendarDays,
};

export function TribesPortalCompactNav({
  activeView,
  activeCategory,
  onViewChange,
  onCategoryChange,
  onScrollToMeetups,
}: TribesInternalSidebarProps) {
  const views: TribesPortalView[] = ["all", "mine", "featured", "meetups"];

  return (
    <nav
      className="space-y-3 xl:hidden"
      aria-label="Filtres tribus"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {views.map((view) => {
          const active = activeView === view && !activeCategory;
          return (
            <button
              key={view}
              type="button"
              onClick={() => {
                onCategoryChange("");
                if (view === "meetups") {
                  onViewChange(view);
                  onScrollToMeetups();
                  return;
                }
                onViewChange(view);
              }}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
                active
                  ? "bg-yunicity-primary text-white shadow-sm"
                  : "border border-neutral-200 bg-white text-neutral-700"
              }`}
            >
              {TRIBES_PORTAL_VIEW_LABELS[view]}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORY_META.map((item) => {
          const active = activeCategory === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onViewChange("all");
                onCategoryChange(active ? "" : item.id);
              }}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
                active
                  ? "bg-white text-neutral-900 shadow-sm ring-1 ring-yunicity-primary/25"
                  : "border border-neutral-200 bg-white text-neutral-700"
              }`}
            >
              {TRIBES_PORTAL_CATEGORY_LABELS[item.id]}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function TribesInternalSidebar({
  activeView,
  activeCategory,
  onViewChange,
  onCategoryChange,
  onScrollToMeetups,
}: TribesInternalSidebarProps) {
  const views: TribesPortalView[] = ["all", "mine", "featured", "meetups"];

  return (
    <aside className="hidden w-56 shrink-0 self-start xl:block xl:w-60">
      <div className="sticky top-24 pb-6 pr-2">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">{TRIBES_PORTAL_PAGE_TITLE}</h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600">{TRIBES_PORTAL_SUBTITLE}</p>
        </div>

        <Link
          href={TRIBES_PORTAL_CREATE_HREF}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {TRIBES_PORTAL_CREATE_CTA}
        </Link>

        <nav className="mt-6 space-y-1" aria-label="Navigation Tribus">
          {views.map((view) => {
            const Icon = VIEW_ICONS[view];
            const active = activeView === view && !activeCategory;
            return (
              <button
                key={view}
                type="button"
                onClick={() => {
                  onCategoryChange("");
                  if (view === "meetups") {
                    onViewChange(view);
                    onScrollToMeetups();
                    return;
                  }
                  onViewChange(view);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
                  active
                    ? "bg-yunicity-primary text-white shadow-sm"
                    : "text-neutral-700 hover:bg-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                <span className="truncate">{TRIBES_PORTAL_VIEW_LABELS[view]}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-8">
          <p className="text-sm font-bold text-neutral-900">Catégories</p>
          <ul className="mt-3 space-y-1">
            {CATEGORY_META.map((item) => {
              const Icon = item.icon;
              const active = activeCategory === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onViewChange("all");
                      onCategoryChange(active ? "" : item.id);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
                      active ? "bg-white shadow-sm ring-1 ring-yunicity-primary/20" : "hover:bg-white"
                    }`}
                  >
                    <span
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.tone}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="font-medium text-neutral-800">
                      {TRIBES_PORTAL_CATEGORY_LABELS[item.id]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-8 rounded-2xl bg-[#EEF0FF] p-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-yunicity-primary/10 text-yunicity-primary">
            <Users className="h-5 w-5" aria-hidden />
          </div>
          <p className="mt-3 text-sm font-semibold text-neutral-900">{TRIBES_PORTAL_SIDEBAR_CTA_TITLE}</p>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600">{TRIBES_PORTAL_SIDEBAR_CTA_BODY}</p>
          <button
            type="button"
            onClick={() => {
              onViewChange("all");
              onCategoryChange("");
              onScrollToMeetups();
            }}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-yunicity-primary-hover"
          >
            {TRIBES_PORTAL_SIDEBAR_CTA_BUTTON}
          </button>
        </div>
      </div>
    </aside>
  );
}
