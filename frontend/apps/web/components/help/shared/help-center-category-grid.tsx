"use client";

import type { HelpCenterCategory } from "@/lib/help/help-center-contract";
import { HELP_CENTER_COPY } from "@/lib/help/help-center-contract";
import {
  ChevronRight,
  MapPin,
  Pencil,
  Rocket,
  Ticket,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";

const TONE_CLASSES: Record<HelpCenterCategory["tone"], string> = {
  blue: "bg-blue-50 text-yunicity-primary",
  purple: "bg-violet-50 text-violet-600",
  rose: "bg-rose-50 text-rose-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  teal: "bg-teal-50 text-teal-600",
};

const GRID_CLASSES = {
  mobile: "grid-cols-1",
  medium: "grid-cols-2",
  desktop: "sm:grid-cols-2 xl:grid-cols-3",
} as const;

function CategoryIcon({ icon }: { icon: HelpCenterCategory["icon"] }) {
  const className = "h-5 w-5";
  switch (icon) {
    case "rocket":
      return <Rocket className={className} aria-hidden />;
    case "account":
      return <UserCircle className={className} aria-hidden />;
    case "discover":
      return <MapPin className={className} aria-hidden />;
    case "tribes":
      return <Users className={className} aria-hidden />;
    case "passport":
      return <Ticket className={className} aria-hidden />;
    default:
      return <Pencil className={className} aria-hidden />;
  }
}

type HelpCenterCategoryGridProps = {
  categories: HelpCenterCategory[];
  variant: keyof typeof GRID_CLASSES;
  titleId?: string;
};

export function HelpCenterCategoryGrid({
  categories,
  variant,
  titleId = "help-center-browse-title",
}: HelpCenterCategoryGridProps) {
  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="text-lg font-bold text-neutral-950 sm:text-xl">
        {HELP_CENTER_COPY.browseTitle}
      </h2>
      {categories.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">Aucune rubrique ne correspond à votre recherche.</p>
      ) : (
        <ul className={`mt-4 grid gap-3 ${GRID_CLASSES[variant]}`}>
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={category.href}
                data-help-center-control={`category-${category.id}`}
                className="flex min-h-11 items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3 shadow-sm transition hover:border-yunicity-primary/20 hover:shadow-md"
              >
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONE_CLASSES[category.tone]}`}
                >
                  <CategoryIcon icon={category.icon} />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-neutral-900">
                  {category.title}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
