"use client";

import type { PartnerOfferPublic } from "@yunicity/types";
import {
  PASSPORT_OFFER_DETAIL_ABOUT_TITLE,
  PASSPORT_OFFER_DETAIL_CONDITIONS_TITLE,
  PASSPORT_OFFER_DETAIL_HOW_STEPS,
  PASSPORT_OFFER_DETAIL_HOW_TITLE,
  PASSPORT_OFFER_DETAIL_PASSPORT_REQUIRED,
  PASSPORT_OFFER_DETAIL_USAGE_ON_SITE,
} from "@yunicity/utils";
import {
  Ban,
  CheckCircle2,
  CircleCheck,
  Clock3,
  Info,
  MapPin,
  Smartphone,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type PassportOfferDesktopBodyProps = {
  offer: PartnerOfferPublic;
  about: string;
  conditions: string[];
  city: string;
};

const HOW_ICONS: LucideIcon[] = [Smartphone, UserRound, CircleCheck];
const CONDITION_ICONS: LucideIcon[] = [CircleCheck, UserRound, MapPin, Ban, Clock3];

export function PassportOfferDesktopBody({
  offer,
  about,
  conditions,
  city,
}: PassportOfferDesktopBodyProps) {
  const steps = PASSPORT_OFFER_DETAIL_HOW_STEPS(offer.partner.name);

  return (
    <>
      <section
        className="feed-desktop-surface p-5 passport-offer-area-about"
        aria-labelledby="passport-offer-about-title"
        data-passport-offer-about=""
      >
        <h2 id="passport-offer-about-title" className="text-lg font-bold text-neutral-900">
          {PASSPORT_OFFER_DETAIL_ABOUT_TITLE}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">{about}</p>
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
            {PASSPORT_OFFER_DETAIL_USAGE_ON_SITE}
          </span>
          <span aria-hidden>•</span>
          <span>{offer.partner.city || city}</span>
          <span aria-hidden>•</span>
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            {PASSPORT_OFFER_DETAIL_PASSPORT_REQUIRED}
          </span>
        </p>
      </section>

      <section
        className="feed-desktop-surface p-5 passport-offer-area-how"
        aria-labelledby="passport-offer-how-title"
        data-passport-offer-how=""
      >
        <h2 id="passport-offer-how-title" className="text-lg font-bold text-neutral-900">
          {PASSPORT_OFFER_DETAIL_HOW_TITLE}
        </h2>
        <ol className="passport-offer-how-steps mt-5 grid gap-4 md:grid-cols-3 md:divide-x md:divide-neutral-100">
          {steps.map((step, index) => {
            const Icon = HOW_ICONS[index] ?? Smartphone;
            return (
              <li key={step.title} className="md:px-4 first:md:pl-0 last:md:pr-0">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF0FF] text-sm font-bold text-yunicity-primary">
                  {index + 1}
                </span>
                <Icon className="mt-3 h-5 w-5 text-yunicity-primary" aria-hidden />
                <p className="mt-2 text-sm font-semibold text-neutral-900">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section
        className="feed-desktop-surface p-5 passport-offer-area-conditions"
        aria-labelledby="passport-offer-conditions-title"
        data-passport-offer-conditions=""
      >
        <h2 id="passport-offer-conditions-title" className="text-lg font-bold text-neutral-900">
          {PASSPORT_OFFER_DETAIL_CONDITIONS_TITLE}
        </h2>
        <ul className="mt-4 space-y-3">
          {conditions.map((item, index) => {
            const Icon = CONDITION_ICONS[index] ?? Info;
            return (
              <li key={item} className="flex items-start gap-3 text-sm text-neutral-700">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                {item}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
