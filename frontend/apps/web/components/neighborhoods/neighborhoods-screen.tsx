"use client";

import { WebAppShell } from "@/components/layout";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import type { Neighborhood } from "@yunicity/types";
import {
  NEIGHBORHOOD_DISCOVER_CTA,
  NEIGHBORHOODS_EMPTY,
  NEIGHBORHOODS_ERROR,
  NEIGHBORHOODS_PAGE_SUBTITLE,
  NEIGHBORHOODS_PAGE_TITLE,
  NEIGHBORHOODS_RETRY,
  neighborhoodAmbianceLine,
  neighborhoodHref,
} from "@yunicity/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function NeighborhoodCard({ hood, city }: { hood: Neighborhood; city: string }) {
  const ambiance = neighborhoodAmbianceLine(hood.ambiance);
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:border-yunicity-primary/25">
      <div className="h-36 bg-neutral-100">
        {hood.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hood.cover_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full items-end p-4"
            style={hood.accent_color ? { backgroundColor: hood.accent_color } : undefined}
          >
            <p className="text-sm font-medium text-neutral-700">{hood.display_name}</p>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-lg font-semibold text-neutral-900">{hood.display_name}</h2>
        {ambiance ? <p className="mt-1 text-sm text-yunicity-primary">{ambiance}</p> : null}
        {hood.short_description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-600">
            {hood.short_description}
          </p>
        ) : null}
        <Link
          href={neighborhoodHref(hood.slug, city)}
          className="mt-5 inline-flex text-sm font-medium text-yunicity-primary underline-offset-2 hover:underline"
        >
          {NEIGHBORHOOD_DISCOVER_CTA}
        </Link>
      </div>
    </article>
  );
}

export function NeighborhoodsScreen() {
  const api = useYunicityApi();
  const { user } = useAuth();
  const city = user?.city ?? "Reims";
  const [items, setItems] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.neighborhoods.listNeighborhoods({ city, page_size: 20 });
      setItems(data.items);
    } catch {
      setError(NEIGHBORHOODS_ERROR);
    } finally {
      setLoading(false);
    }
  }, [api.neighborhoods, city]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <WebAppShell
      contentWidth="wide"
      context={
        <aside className="space-y-3 text-sm text-neutral-600">
          <p className="font-semibold text-neutral-900">Explorer sans se fermer</p>
          <p>Chaque quartier est une fenêtre sur {city} — pas une bulle sociale.</p>
        </aside>
      }
    >
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">{NEIGHBORHOODS_PAGE_TITLE}</h1>
        <p className="mt-2 text-neutral-600">{NEIGHBORHOODS_PAGE_SUBTITLE}</p>
      </header>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="h-64 rounded-2xl border border-neutral-200 bg-neutral-50 opacity-70"
            />
          ))}
        </div>
      ) : null}
      {error ? (
        <div className="space-y-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
          >
            {NEIGHBORHOODS_RETRY}
          </button>
        </div>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <p className="text-neutral-500">{NEIGHBORHOODS_EMPTY}</p>
      ) : null}
      {!loading && !error && items.length > 0 ? (
        <ul className="grid gap-6 sm:grid-cols-2">
          {items.map((hood) => (
            <li key={hood.id}>
              <NeighborhoodCard hood={hood} city={city} />
            </li>
          ))}
        </ul>
      ) : null}
    </WebAppShell>
  );
}
