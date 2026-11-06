"use client";

import {
  TRIBES_DESKTOP_BREADCRUMB,
  TRIBES_DESKTOP_EDITORIAL_BODY,
  TRIBES_DESKTOP_EDITORIAL_TITLE,
} from "@yunicity/utils";

type TribesMediumEditorialProps = {
  city: string;
};

export function TribesMediumEditorial({ city }: TribesMediumEditorialProps) {
  return (
    <header className="space-y-2" data-tribes-medium-editorial="">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-yunicity-primary">
        {TRIBES_DESKTOP_BREADCRUMB(city)}
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
        {TRIBES_DESKTOP_EDITORIAL_TITLE}
      </h1>
      <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">{TRIBES_DESKTOP_EDITORIAL_BODY}</p>
    </header>
  );
}
