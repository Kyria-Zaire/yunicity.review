"use client";

import { EVENT_DETAIL_BACK_SORTIR } from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type EventMediumHeaderProps = {
  categoryLabel: string;
};

/** Chrome page medium : Retour + catégorie (maquette event-medium). */
export function EventMediumHeader({ categoryLabel }: EventMediumHeaderProps) {
  return (
    <header
      className="event-medium-header flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-white px-3 py-2.5"
      data-event-medium-header=""
    >
      <Link
        href="/sortir"
        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-600 transition hover:text-yunicity-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {EVENT_DETAIL_BACK_SORTIR}
      </Link>
      <span className="text-sm text-neutral-400">{categoryLabel}</span>
    </header>
  );
}
