"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { PlacesAppShell } from "@/components/places/places-app-shell";
import type {
  LocalEvent,
  PartnerCreatorContentPublic,
  PartnerOfferPublic,
  PartnerPublic,
} from "@yunicity/types";
import {
  PARTNER_DETAIL_CREATOR_CONTENT_EMPTY,
  PARTNER_DETAIL_CREATOR_CONTENT_TITLE,
  PARTNER_DETAIL_EVENTS_CTA,
  PARTNER_DETAIL_EVENTS_EMPTY,
  PARTNER_DETAIL_EVENTS_TITLE,
  PARTNER_DETAIL_MAP_NOTICE,
  PARTNER_DETAIL_PASSPORT_EMPTY,
  PARTNER_DETAIL_PASSPORT_TITLE,
  PARTNER_DETAIL_PRACTICAL_TITLE,
  PARTNER_DETAIL_VERIFIED,
  PARTNER_DETAIL_WHY_BODY,
  PARTNER_DETAIL_WHY_TITLE,
  formatEventDateRange,
  formatOfferValidUntil,
  partnerOfferValueLabel,
  hasPartnerCoordinates,
  partnerBadgeLabel,
  partnerBadgeTone,
  partnerContactActions,
  partnerDisplayCategory,
  partnerPublicHref,
  resolvePartnerImage,
} from "@yunicity/utils";
import { ChevronLeft, ExternalLink, Phone, Share2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

import { PartnerCreatorContentCard } from "./partner-creator-content-card";

function buildEventHref(eventId: string): string {
  return `/events/${encodeURIComponent(eventId)}`;
}

type PartnerDetailScreenProps = {
  partner: PartnerPublic;
};

const BADGE_TONE_CLASS: Record<string, string> = {
  default: "bg-yunicity-primary text-white",
  founding: "bg-amber-500 text-white",
  premium: "bg-violet-600 text-white",
};

export function PartnerDetailScreen({ partner }: PartnerDetailScreenProps) {
  const api = useYunicityApi();
  const [offers, setOffers] = useState<PartnerOfferPublic[]>([]);
  const [partnerEvents, setPartnerEvents] = useState<LocalEvent[]>([]);
  const [creatorContents, setCreatorContents] = useState<PartnerCreatorContentPublic[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(false);
  const [creatorLoading, setCreatorLoading] = useState(true);
  const [creatorError, setCreatorError] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);

  const heroUrl = resolvePartnerImage(partner, "hero");
  const logoUrl = resolvePartnerImage(partner, "logo");
  const actions = useMemo(() => partnerContactActions(partner), [partner]);
  const partnerOffers = offers;
  const badgeTone = partnerBadgeTone(partner.partner_status);

  useEffect(() => {
    let cancelled = false;
    void Promise.allSettled([
      api.listPartnerOffers(partner.slug, partner.city, { limit: 20 }),
      api.listPartnerEvents(partner.slug, { upcoming_only: true, limit: 6 }),
      api.listPartnerCreatorContent(partner.slug, { city: partner.city, limit: 6 }),
    ]).then(([offersRes, eventsRes, creatorRes]) => {
      if (cancelled) return;
      if (offersRes.status === "fulfilled") setOffers(offersRes.value.items);
      if (eventsRes.status === "fulfilled") {
        setPartnerEvents(eventsRes.value.items);
      } else {
        setEventsError(true);
      }
      if (creatorRes.status === "fulfilled") {
        setCreatorContents(creatorRes.value.items);
      } else {
        setCreatorError(true);
      }
      setEventsLoading(false);
      setCreatorLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [api, partner.city, partner.slug]);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : partnerPublicHref(partner);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: partner.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint("Lien copié");
      setTimeout(() => setShareHint(null), 2000);
    } catch {
      /* annulation */
    }
  }

  return (
    <PlacesAppShell>
      <div className="mx-auto w-full max-w-[1100px] space-y-8 px-0 py-2 sm:py-4">
        <Link
          href={`/places?city=${encodeURIComponent(partner.city)}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Lieux
        </Link>

        <article className="relative overflow-hidden rounded-3xl bg-neutral-950 shadow-lg">
          <div className="relative min-h-[280px] sm:min-h-[320px]">
            <CulturalImage
              src={heroUrl}
              alt={partner.name}
              placeName={partner.name}
              className="absolute inset-0 h-full w-full"
              sizes="(max-width: 1100px) 100vw"
              priority
              showFallbackCaption={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/92 via-neutral-950/50 to-neutral-950/20" />
            <div className="relative flex min-h-[280px] flex-col justify-end gap-4 p-6 sm:min-h-[320px] sm:flex-row sm:items-end sm:p-8">
              {logoUrl ? (
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white/20 bg-white shadow-md sm:h-24 sm:w-24">
                  <CulturalImage
                    src={logoUrl}
                    alt=""
                    placeName={partner.name}
                    className="h-full w-full"
                    sizes="96px"
                    showFallbackCaption={false}
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${BADGE_TONE_CLASS[badgeTone] ?? BADGE_TONE_CLASS.default}`}
                >
                  {partnerBadgeLabel(partner.partner_status)}
                </span>
                <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{partner.name}</h1>
                <p className="mt-1 text-sm text-white/85">
                  {partnerDisplayCategory(partner)} · {partner.city}
                </p>
                {partner.is_verified ? (
                  <p className="mt-2 text-xs font-medium text-emerald-300">{PARTNER_DETAIL_VERIFIED}</p>
                ) : null}
              </div>
            </div>
          </div>
        </article>

        <div className="flex flex-wrap gap-2">
          {actions.map((action) =>
            action.disabled ? (
              <span
                key={action.id}
                title={action.disabledReason}
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold text-neutral-400"
              >
                {action.label}
              </span>
            ) : (
              <Link
                key={action.id}
                href={action.href}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-yunicity-primary shadow-sm transition hover:border-yunicity-primary/30"
              >
                {action.id === "call" ? <Phone className="h-4 w-4" aria-hidden /> : null}
                {action.external ? <ExternalLink className="h-4 w-4" aria-hidden /> : null}
                {action.label}
              </Link>
            ),
          )}
          <button
            type="button"
            onClick={() => void handleShare()}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            Partager
          </button>
          {shareHint ? <span className="self-center text-xs text-neutral-500">{shareHint}</span> : null}
        </div>

        {!hasPartnerCoordinates(partner) ? (
          <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {PARTNER_DETAIL_MAP_NOTICE}
          </p>
        ) : null}

        <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900">{PARTNER_DETAIL_PRACTICAL_TITLE}</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500">Catégorie</dt>
              <dd className="font-medium text-neutral-900">{partnerDisplayCategory(partner)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Ville</dt>
              <dd className="font-medium text-neutral-900">{partner.city}</dd>
            </div>
            {partner.address ? (
              <div className="sm:col-span-2">
                <dt className="text-neutral-500">Adresse</dt>
                <dd className="font-medium text-neutral-900">
                  {partner.address}
                  {partner.postal_code ? `, ${partner.postal_code}` : ""}
                </dd>
              </div>
            ) : null}
            {partner.phone ? (
              <div>
                <dt className="text-neutral-500">Téléphone</dt>
                <dd>
                  <a href={`tel:${partner.phone}`} className="font-medium text-yunicity-primary hover:underline">
                    {partner.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {partner.website_url ? (
              <div>
                <dt className="text-neutral-500">Site web</dt>
                <dd>
                  <a
                    href={partner.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-yunicity-primary hover:underline"
                  >
                    {partner.website_url.replace(/^https?:\/\//, "")}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="rounded-2xl border border-yunicity-primary/15 bg-yunicity-primary-soft/40 p-6">
          <h2 className="text-lg font-bold text-neutral-900">{PARTNER_DETAIL_WHY_TITLE}</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            {partner.description?.trim() || PARTNER_DETAIL_WHY_BODY}
          </p>
        </section>

        <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900">{PARTNER_DETAIL_PASSPORT_TITLE}</h2>
          {partnerOffers.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {partnerOffers.map((offer) => (
                <li
                  key={offer.id}
                  className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-4 py-3"
                >
                  <p className="font-semibold text-neutral-900">{offer.title}</p>
                  <p className="text-xs font-medium text-yunicity-primary">
                    {partnerOfferValueLabel(offer)}
                  </p>
                  {offer.description ? (
                    <p className="mt-1 text-sm text-neutral-600">{offer.description}</p>
                  ) : null}
                  {offer.valid_until ? (
                    <p className="mt-1 text-xs text-neutral-500">
                      {formatOfferValidUntil(offer.valid_until)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-neutral-600">{PARTNER_DETAIL_PASSPORT_EMPTY}</p>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900">{PARTNER_DETAIL_CREATOR_CONTENT_TITLE}</h2>
          {creatorLoading ? (
            <p className="mt-3 text-sm text-neutral-500">Chargement…</p>
          ) : creatorError ? (
            <p className="mt-3 text-sm text-red-600">Impossible de charger les contenus.</p>
          ) : creatorContents.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-600">{PARTNER_DETAIL_CREATOR_CONTENT_EMPTY}</p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {creatorContents.map((item) => (
                <li key={item.id}>
                  <PartnerCreatorContentCard item={item} partnerName={partner.name} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900">{PARTNER_DETAIL_EVENTS_TITLE}</h2>
          {eventsLoading ? (
            <p className="mt-3 text-sm text-neutral-500">Chargement…</p>
          ) : eventsError ? (
            <p className="mt-3 text-sm text-red-600">Impossible de charger les moments.</p>
          ) : partnerEvents.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-600">{PARTNER_DETAIL_EVENTS_EMPTY}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {partnerEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-neutral-900">{event.title}</p>
                    <p className="mt-0.5 text-xs font-medium text-yunicity-primary">
                      {formatEventDateRange(event.starts_at, event.ends_at).split(" · ")[0]}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">{event.location_name}</p>
                  </div>
                  <Link
                    href={buildEventHref(event.id)}
                    className="shrink-0 text-sm font-semibold text-yunicity-primary hover:underline"
                  >
                    {PARTNER_DETAIL_EVENTS_CTA}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PlacesAppShell>
  );
}
