"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { MyAgendaItem } from "@yunicity/utils";
import {
  MY_AGENDA_OPEN_MAP,
  MY_AGENDA_REMOVE,
  MY_AGENDA_REMOVE_ARIA,
  MY_AGENDA_VIEW_EVENT,
} from "@yunicity/utils";
import { MapPin, Trash2 } from "lucide-react";
import Link from "next/link";

type MyAgendaEventRowProps = {
  item: MyAgendaItem;
  onRemove: (eventId: string) => void;
  removing?: boolean;
  dense?: boolean;
};

export function MyAgendaEventRow({
  item,
  onRemove,
  removing = false,
  dense = false,
}: MyAgendaEventRowProps) {
  return (
    <article
      className={`group relative flex overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow,transform] duration-200 ease-out hover:border-neutral-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] active:scale-[0.995] ${
        dense ? "gap-0" : ""
      }`}
    >
      <div
        className={`flex shrink-0 flex-col items-center justify-center border-r border-neutral-100/90 bg-[linear-gradient(180deg,#F8F9FC_0%,#F3F4F8_100%)] text-center ${
          dense ? "w-[4.25rem] px-2 py-3" : "w-[4.75rem] px-2.5 py-3.5"
        }`}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-yunicity-primary">
          {item.weekdayLabel}
        </p>
        <p className="mt-0.5 text-[1.65rem] font-bold leading-none tracking-tight text-neutral-950">
          {item.dayLabel}
        </p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-500">
          {item.monthLabel}
        </p>
      </div>

      <div className={`relative hidden shrink-0 overflow-hidden bg-neutral-100 sm:block ${dense ? "w-24" : "w-[7.25rem]"}`}>
        <CulturalImage
          src={item.imageUrl}
          alt={item.title}
          placeName={item.title}
          sizes="116px"
          className="absolute inset-0 h-full w-full"
          imageClassName="h-full w-full object-cover transition duration-300 ease-out group-hover:scale-[1.03]"
          dimOverlay={false}
          showFallbackCaption={false}
          fallbackLabel="Sortie"
        />
      </div>

      <div className={`flex min-w-0 flex-1 flex-col justify-center gap-1.5 ${dense ? "p-3" : "p-3.5 sm:p-4"}`}>
        {item.categoryLabel ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-500">
            {item.categoryLabel}
          </p>
        ) : null}
        <h3 className="text-sm font-bold leading-snug tracking-tight text-neutral-950 sm:text-[15px]">
          <Link href={item.href} className="transition-colors hover:text-yunicity-primary">
            {item.title}
          </Link>
        </h3>
        <p className="text-xs font-semibold text-yunicity-primary">{item.timeLabel}</p>
        <p className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          <span className="line-clamp-1">{item.placeLabel}</span>
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Link
            href={item.href}
            className="inline-flex min-h-8 items-center rounded-lg bg-yunicity-primary px-2.5 text-xs font-semibold text-white transition hover:bg-yunicity-primary/90 active:scale-[0.98]"
          >
            {MY_AGENDA_VIEW_EVENT}
          </Link>
          <Link
            href={item.mapHref}
            className="inline-flex min-h-8 items-center rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98]"
          >
            {MY_AGENDA_OPEN_MAP}
          </Link>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={removing}
            aria-label={MY_AGENDA_REMOVE_ARIA}
            className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-neutral-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            {MY_AGENDA_REMOVE}
          </button>
        </div>
      </div>
    </article>
  );
}
