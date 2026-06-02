"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { ProfileJourneyCta, ProfileLocalLandmark, ProfileTimelineItem } from "@yunicity/utils";
import {
  PROFILE_PORTAL_JOURNEY_EMPTY_BODY,
  PROFILE_PORTAL_JOURNEY_EMPTY_TITLE,
  PROFILE_PORTAL_JOURNEY_LANDMARKS_TITLE,
  PROFILE_PORTAL_JOURNEY_SUBTITLE,
  PROFILE_PORTAL_JOURNEY_TITLE,
} from "@yunicity/utils";
import {
  Award,
  CalendarDays,
  Compass,
  MapPin,
  Pencil,
  Sparkles,
  Stamp,
  Users,
} from "lucide-react";
import Link from "next/link";

type ProfileActivitySectionProps = {
  timeline: ProfileTimelineItem[];
  landmarks: ProfileLocalLandmark[];
  ctas: ProfileJourneyCta[];
};

const TIMELINE_ICONS = {
  post: Pencil,
  event_saved: CalendarDays,
  event_interest: CalendarDays,
  stamp: MapPin,
  badge_earned: Award,
  passport_activated: Stamp,
} as const;

const LANDMARK_ICONS = {
  tribe: Users,
  event_saved: CalendarDays,
  event_interest: CalendarDays,
  badge: Award,
  neighborhood: MapPin,
} as const;

export function ProfileActivitySection({ timeline, landmarks, ctas }: ProfileActivitySectionProps) {
  const hasContent = timeline.length > 0 || landmarks.length > 0;

  return (
    <section
      id="profile-activity"
      className="scroll-mt-24 rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
    >
      <header className="border-b border-neutral-100 px-5 py-4">
        <h2 className="text-lg font-bold text-neutral-900">{PROFILE_PORTAL_JOURNEY_TITLE}</h2>
        <p className="mt-1 text-sm text-neutral-600">{PROFILE_PORTAL_JOURNEY_SUBTITLE}</p>
      </header>

      <div className="px-5 py-5">
        {!hasContent ? (
          <ProfileJourneyEmpty ctas={ctas} />
        ) : (
          <div className="space-y-6">
            {timeline.length > 0 ? <ProfileTimelineList items={timeline} /> : null}
            {landmarks.length > 0 ? <ProfileLandmarksGrid items={landmarks} /> : null}
            {timeline.length === 0 && landmarks.length > 0 ? (
              <ProfileJourneyCtaRow ctas={ctas} compact />
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function ProfileTimelineList({ items }: { items: ProfileTimelineItem[] }) {
  return (
    <ol className="relative space-y-0">
      {items.map((item, index) => {
        const Icon = TIMELINE_ICONS[item.kind] ?? Sparkles;
        const isLast = index === items.length - 1;
        return (
          <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                className="absolute left-[1.125rem] top-10 h-[calc(100%-1.5rem)] w-px bg-neutral-200"
                aria-hidden
              />
            ) : null}
            <span className="relative z-[1] inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-yunicity-primary ring-4 ring-white">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <Link href={item.href} className="group min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-neutral-600">
                    {item.description}
                  </p>
                  <p className="mt-2 text-xs text-neutral-400">{item.timestampLabel}</p>
                </div>
                {item.imageUrl ? (
                  <div className="relative hidden h-14 w-20 shrink-0 overflow-hidden rounded-xl sm:block">
                    <CulturalImage
                      src={item.imageUrl}
                      alt=""
                      placeName={item.description}
                      className="size-full"
                      sizes="80px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                  </div>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function ProfileLandmarksGrid({ items }: { items: ProfileLocalLandmark[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-neutral-900">{PROFILE_PORTAL_JOURNEY_LANDMARKS_TITLE}</h3>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = LANDMARK_ICONS[item.kind] ?? Compass;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex h-full gap-3 rounded-xl border border-neutral-200/90 bg-neutral-50/60 p-3 transition hover:border-yunicity-primary/20 hover:bg-white"
              >
                {item.imageUrl ? (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    <CulturalImage
                      src={item.imageUrl}
                      alt=""
                      placeName={item.description}
                      className="size-full"
                      sizes="48px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                  </div>
                ) : (
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-yunicity-primary ring-1 ring-neutral-200/80">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {item.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-medium text-neutral-900 group-hover:text-yunicity-primary">
                    {item.description}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProfileJourneyEmpty({ ctas }: { ctas: ProfileJourneyCta[] }) {
  return (
    <div className="rounded-2xl bg-yunicity-primary-soft/40 px-4 py-6 text-center ring-1 ring-yunicity-primary/10">
      <p className="text-base font-bold text-neutral-900">{PROFILE_PORTAL_JOURNEY_EMPTY_TITLE}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
        {PROFILE_PORTAL_JOURNEY_EMPTY_BODY}
      </p>
      <ProfileJourneyCtaRow ctas={ctas} />
    </div>
  );
}

function ProfileJourneyCtaRow({ ctas, compact = false }: { ctas: ProfileJourneyCta[]; compact?: boolean }) {
  return (
    <ul className={`grid gap-3 ${compact ? "mt-2 sm:grid-cols-3" : "mt-5 sm:grid-cols-3"}`}>
      {ctas.map((cta) => (
        <li key={cta.id}>
          <Link
            href={cta.href}
            className="flex h-full items-center justify-center rounded-xl border border-yunicity-primary/20 bg-white px-4 py-3 text-sm font-semibold text-yunicity-primary transition hover:bg-yunicity-primary hover:text-white"
          >
            {cta.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
