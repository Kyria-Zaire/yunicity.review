"use client";

import { LOCAL_VIDEO_TEASER_CTA, type LocalVideoTeaserView } from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

type LocalVideoTeaserCardProps = {
  view: LocalVideoTeaserView;
};

export function LocalVideoTeaserCard({ view }: LocalVideoTeaserCardProps) {
  return (
    <div className="group relative flex gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm transition focus-within:border-yunicity-primary/40 hover:border-yunicity-primary/30 hover:shadow-md">
      <div
        data-feed-video-media=""
        className="relative h-[7.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-neutral-200"
      >
        {/* Thumbnail only — no video element (C2-S5 perf rule). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={view.thumbnailUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-neutral-950/75 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
          {view.duration}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-yunicity-primary">
            {view.neighborhoodName}
          </p>
          {/*
            Lien étendu : toute la carte ouvre la vidéo, mais un seul élément
            focusable porte cette action — le CTA « Y aller » reste un second
            arrêt clavier distinct, au-dessus de la zone étendue.
          */}
          <Link
            href={view.href}
            className="rounded-sm text-sm font-bold leading-snug text-neutral-900 before:absolute before:inset-0 before:rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
          >
            <span className="line-clamp-2">{view.title}</span>
          </Link>
          <p className="text-xs font-medium text-neutral-600">{view.authorName}</p>
          <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
            {view.typeLabel}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs font-semibold text-yunicity-primary group-hover:underline">
            {LOCAL_VIDEO_TEASER_CTA}
          </span>
          {view.destination ? (
            // Uniquement quand une destination REELLE est liée. `relative` place
            // ce lien au-dessus du lien étendu : il reste cliquable et gagne son
            // propre arrêt clavier.
            <Link
              href={view.destination.href}
              className="relative inline-flex min-h-11 items-center gap-1 rounded-lg px-1 text-xs font-semibold text-neutral-700 underline-offset-2 transition hover:text-yunicity-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {view.destination.label}
              <span className="sr-only"> — {view.title}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
