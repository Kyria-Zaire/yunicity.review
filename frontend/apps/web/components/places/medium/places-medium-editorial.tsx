"use client";

import {
  PLACES_DESKTOP_BREADCRUMB,
  PLACES_DESKTOP_EDITORIAL_BODY,
  PLACES_DESKTOP_EDITORIAL_TITLE,
} from "@yunicity/utils";

type PlacesMediumEditorialProps = {
  city: string;
};

export function PlacesMediumEditorial({ city }: PlacesMediumEditorialProps) {
  return (
    <header className="space-y-2" data-places-medium-editorial="">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-yunicity-primary">
        {PLACES_DESKTOP_BREADCRUMB(city)}
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
        {PLACES_DESKTOP_EDITORIAL_TITLE}
      </h1>
      <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">{PLACES_DESKTOP_EDITORIAL_BODY}</p>
    </header>
  );
}
