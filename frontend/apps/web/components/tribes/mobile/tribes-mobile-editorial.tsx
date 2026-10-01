"use client";

import {
  TRIBES_DESKTOP_BREADCRUMB,
  TRIBES_DESKTOP_EDITORIAL_TITLE,
  TRIBES_MOBILE_EDITORIAL_BODY,
} from "@yunicity/utils";

type TribesMobileEditorialProps = {
  city: string;
};

export function TribesMobileEditorial({ city }: TribesMobileEditorialProps) {
  return (
    <header className="space-y-1.5" data-tribes-mobile-editorial="">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-yunicity-primary">
        {TRIBES_DESKTOP_BREADCRUMB(city)}
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{TRIBES_DESKTOP_EDITORIAL_TITLE}</h1>
      <p className="text-sm leading-relaxed text-neutral-600">{TRIBES_MOBILE_EDITORIAL_BODY}</p>
    </header>
  );
}
