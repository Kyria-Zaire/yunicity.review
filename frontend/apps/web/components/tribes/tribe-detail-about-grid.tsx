"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type {
  TribeDetailAboutFact,
  TribeDetailEventCard,
  TribeDetailMemberPreview,
  TribeDetailPostCard,
} from "@yunicity/utils";
import {
  TRIBE_DETAIL_PORTAL_ABOUT_TITLE,
  TRIBE_DETAIL_PORTAL_EVENTS_CTA,
  TRIBE_DETAIL_PORTAL_EVENTS_EMPTY,
  TRIBE_DETAIL_PORTAL_EVENTS_TITLE,
  TRIBE_DETAIL_PORTAL_MEMBERS_ACTIVE,
  TRIBE_DETAIL_PORTAL_MEMBERS_CTA,
  TRIBE_DETAIL_PORTAL_MEMBERS_GUEST,
  TRIBE_DETAIL_PORTAL_MEMBERS_TITLE,
  TRIBE_DETAIL_PORTAL_POSTS_CTA,
  TRIBE_DETAIL_PORTAL_POSTS_EMPTY,
  TRIBE_DETAIL_PORTAL_POSTS_GUEST,
  TRIBE_DETAIL_PORTAL_POSTS_TITLE,
} from "@yunicity/utils";
import { Calendar, Grid3x3, Languages, MapPin, Shield, User } from "lucide-react";
import Link from "next/link";

const FACT_ICONS: Record<string, typeof Calendar> = {
  created: Calendar,
  category: Grid3x3,
  language: Languages,
  visibility: Shield,
};

type TribeDetailAboutGridProps = {
  description: string;
  facts: TribeDetailAboutFact[];
  events: TribeDetailEventCard[];
  members: TribeDetailMemberPreview[];
  posts: TribeDetailPostCard[];
  membersTotal: number;
  canSeeMembers: boolean;
  canSeePosts: boolean;
  eventsHref: string;
};

export function TribeDetailAboutGrid({
  description,
  facts,
  events,
  members,
  posts,
  membersTotal,
  canSeeMembers,
  canSeePosts,
  eventsHref,
}: TribeDetailAboutGridProps) {
  return (
    <div id="tribe-about" className="scroll-mt-28 grid gap-5 lg:grid-cols-3 lg:items-start">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm lg:col-span-1">
        <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_PORTAL_ABOUT_TITLE}</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">
          {description || "Cette tribu prend forme au fil des rencontres locales."}
        </p>
        <dl className="mt-5 space-y-3">
          {facts.map((fact) => {
            const Icon = FACT_ICONS[fact.id] ?? User;
            return (
              <div key={fact.id} className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yunicity-primary-soft text-yunicity-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {fact.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-neutral-900">{fact.value}</dd>
                </div>
              </div>
            );
          })}
        </dl>
      </section>

      <section className="space-y-5 lg:col-span-1">
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_PORTAL_EVENTS_TITLE}</h2>
            {events.length > 0 ? (
              <a href="#tribe-events" className="text-xs font-semibold text-yunicity-primary hover:underline">
                {TRIBE_DETAIL_PORTAL_EVENTS_CTA} →
              </a>
            ) : null}
          </div>
          {events.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">{TRIBE_DETAIL_PORTAL_EVENTS_EMPTY}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {events.slice(0, 3).map((event) => (
                <li key={event.id}>
                  <Link
                    href={event.href}
                    className="group flex gap-3 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3 transition hover:border-yunicity-primary/20 hover:bg-white"
                  >
                    <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-pink-50 px-1 py-2 text-center text-pink-700">
                      <span className="text-[10px] font-bold uppercase">{event.dateBadgeDay}</span>
                      <span className="text-xl font-bold leading-none">{event.dateBadgeDate}</span>
                      <span className="text-[10px] font-semibold uppercase">{event.dateBadgeMonth}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-neutral-900 group-hover:text-yunicity-primary">
                        {event.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{event.timeLabel}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-500">
                        <MapPin className="h-3 w-3" aria-hidden />
                        {event.locationLabel}
                      </p>
                    </div>
                    {event.imageUrl ? (
                      <div className="relative hidden h-14 w-14 shrink-0 overflow-hidden rounded-lg sm:block">
                        <CulturalImage
                          src={event.imageUrl}
                          alt=""
                          placeName={event.title}
                          className="size-full"
                          sizes="56px"
                          showFallbackCaption={false}
                          overlay={false}
                        />
                      </div>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {events.length > 0 ? (
            <Link
              href={eventsHref}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-yunicity-primary/30 px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-yunicity-primary-soft/40"
            >
              {TRIBE_DETAIL_PORTAL_EVENTS_CTA} →
            </Link>
          ) : null}
        </div>
      </section>

      <div className="space-y-5 lg:col-span-1">
        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-neutral-900">
              {TRIBE_DETAIL_PORTAL_MEMBERS_TITLE}
              {membersTotal > 0 ? ` (${membersTotal})` : ""}
            </h2>
            {canSeeMembers && members.length > 0 ? (
              <a href="#tribe-members" className="text-xs font-semibold text-yunicity-primary hover:underline">
                {TRIBE_DETAIL_PORTAL_MEMBERS_CTA} →
              </a>
            ) : null}
          </div>
          {!canSeeMembers ? (
            <p className="mt-4 text-sm text-neutral-500">{TRIBE_DETAIL_PORTAL_MEMBERS_GUEST}</p>
          ) : members.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">{TRIBE_DETAIL_PORTAL_MEMBERS_GUEST}</p>
          ) : (
            <>
              <ul className="mt-4 flex -space-x-2">
                {members.slice(0, 6).map((member) => (
                  <li key={member.id}>
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-yunicity-primary-soft text-xs font-bold text-yunicity-primary"
                      title={member.label}
                    >
                      {member.initial}
                    </span>
                  </li>
                ))}
                {membersTotal > members.length ? (
                  <li>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-neutral-100 text-[10px] font-semibold text-neutral-600">
                      +{membersTotal - Math.min(members.length, 6)}
                    </span>
                  </li>
                ) : null}
              </ul>
              <div className="mt-4">
                <p className="text-sm font-semibold text-neutral-900">{TRIBE_DETAIL_PORTAL_MEMBERS_ACTIVE}</p>
                <ul className="mt-2 space-y-2">
                  {members.slice(0, 4).map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-900">{member.label}</p>
                        <p className="text-xs text-neutral-500">{member.roleLabel}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_PORTAL_POSTS_TITLE}</h2>
            {canSeePosts && posts.length > 0 ? (
              <a href="#tribe-posts" className="text-xs font-semibold text-yunicity-primary hover:underline">
                {TRIBE_DETAIL_PORTAL_POSTS_CTA} →
              </a>
            ) : null}
          </div>
          {!canSeePosts ? (
            <p className="mt-4 text-sm text-neutral-500">{TRIBE_DETAIL_PORTAL_POSTS_GUEST}</p>
          ) : posts.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">{TRIBE_DETAIL_PORTAL_POSTS_EMPTY}</p>
          ) : (
            <article className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50/70 p-4">
              <p className="text-sm font-semibold text-neutral-900">{posts[0]?.authorLabel}</p>
              <p className="mt-1 text-xs text-neutral-400">{posts[0]?.timestampLabel}</p>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-700">{posts[0]?.body}</p>
            </article>
          )}
        </section>
      </div>
    </div>
  );
}
