"use client";

import { WebAppShell } from "@/components/layout";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type { NeighborhoodContextResponse } from "@yunicity/types";
import {
  NEIGHBORHOOD_DETAIL_EMPTY_SECTION,
  NEIGHBORHOOD_DETAIL_EVENTS,
  NEIGHBORHOOD_DETAIL_OFFERS,
  NEIGHBORHOOD_DETAIL_ORGS,
  NEIGHBORHOOD_DETAIL_POSTS,
  NEIGHBORHOOD_NOT_FOUND,
  NEIGHBORHOODS_RETRY,
  formatEventDateRange,
  neighborhoodAmbianceLine,
} from "@yunicity/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export function NeighborhoodDetailScreen({ slug, city }: { slug: string; city: string }) {
  const api = useYunicityApi();
  const [data, setData] = useState<NeighborhoodContextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ctx = await api.neighborhoods.getNeighborhoodContext(slug, city);
      setData(ctx);
    } catch {
      setError(NEIGHBORHOOD_NOT_FOUND);
    } finally {
      setLoading(false);
    }
  }, [api.neighborhoods, slug, city]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <WebAppShell contentWidth="wide">
        <p className="text-neutral-500">Chargement…</p>
      </WebAppShell>
    );
  }

  if (error || !data) {
    return (
      <WebAppShell contentWidth="readable">
        <p className="text-red-600">{error ?? NEIGHBORHOOD_NOT_FOUND}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
        >
          {NEIGHBORHOODS_RETRY}
        </button>
      </WebAppShell>
    );
  }

  const hood = data.neighborhood;
  const ambiance = neighborhoodAmbianceLine(hood.ambiance);

  return (
    <WebAppShell contentWidth="wide">
      <header className="mb-10 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        {hood.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hood.cover_image_url}
            alt=""
            className="mb-6 max-h-56 w-full rounded-xl object-cover"
          />
        ) : null}
        <p className="text-sm text-neutral-500">{hood.city}</p>
        <h1 className="mt-1 text-3xl font-bold text-neutral-900">{hood.display_name}</h1>
        {ambiance ? <p className="mt-2 text-yunicity-primary">{ambiance}</p> : null}
        {hood.short_description ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-700">
            {hood.short_description}
          </p>
        ) : null}
      </header>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-neutral-900">{NEIGHBORHOOD_DETAIL_EVENTS}</h2>
        {data.recent_events.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">{NEIGHBORHOOD_DETAIL_EMPTY_SECTION}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.recent_events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="block rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:border-yunicity-primary/30"
                >
                  <p className="font-medium text-neutral-900">{event.title}</p>
                  <p className="text-sm text-neutral-500">
                    {formatEventDateRange(event.starts_at, null)} · {event.location_name}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-neutral-900">{NEIGHBORHOOD_DETAIL_ORGS}</h2>
        {data.organizations.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">{NEIGHBORHOOD_DETAIL_EMPTY_SECTION}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.organizations.map((org) => (
              <li key={org.id} className="text-sm text-neutral-700">
                {org.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-neutral-900">{NEIGHBORHOOD_DETAIL_OFFERS}</h2>
        {data.recent_offers.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">{NEIGHBORHOOD_DETAIL_EMPTY_SECTION}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.recent_offers.map((offer) => (
              <li key={offer.id} className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
                <p className="font-medium text-neutral-900">{offer.title}</p>
                <p className="text-xs text-neutral-500">{offer.organization_name}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-neutral-900">{NEIGHBORHOOD_DETAIL_POSTS}</h2>
        {data.recent_posts.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">{NEIGHBORHOOD_DETAIL_EMPTY_SECTION}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.recent_posts.map((post) => (
              <li key={post.id} className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
                {post.title ? (
                  <p className="font-medium text-neutral-900">{post.title}</p>
                ) : null}
                {post.body ? (
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{post.body}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </WebAppShell>
  );
}
