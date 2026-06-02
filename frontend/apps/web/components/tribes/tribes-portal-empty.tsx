"use client";

import {
  TRIBES_PORTAL_CREATE_CTA,
  TRIBES_PORTAL_CREATE_HREF,
  TRIBES_PORTAL_LIST_EMPTY,
  TRIBES_PORTAL_LIST_EMPTY_FILTER,
} from "@yunicity/utils";
import { Plus } from "lucide-react";
import Link from "next/link";

type TribesPortalEmptyProps = {
  variant: "default" | "filter" | "mine";
  city: string;
};

export function TribesPortalEmpty({ variant, city }: TribesPortalEmptyProps) {
  const tribesHref = `/tribes?city=${encodeURIComponent(city)}`;

  if (variant === "mine") {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
        <p className="text-sm leading-relaxed text-neutral-600">
          Vous n’avez rejoint aucune tribu pour l’instant.
        </p>
        <Link
          href={tribesHref}
          className="mt-4 inline-flex rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
        >
          Explorer les tribus
        </Link>
      </div>
    );
  }

  const message =
    variant === "filter" ? TRIBES_PORTAL_LIST_EMPTY_FILTER : TRIBES_PORTAL_LIST_EMPTY;

  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
      <p className="text-sm leading-relaxed text-neutral-600">{message}</p>
      <Link
        href={TRIBES_PORTAL_CREATE_HREF}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {TRIBES_PORTAL_CREATE_CTA}
      </Link>
    </div>
  );
}
