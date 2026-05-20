"use client";

import { TribeCard } from "@/components/tribes/tribe-card";
import { WebAppShell } from "@/components/layout";
import { useTribesList } from "@/hooks/use-tribes";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  TRIBES_EMPTY,
  TRIBES_LOADING,
  TRIBES_PAGE_SUBTITLE,
  TRIBES_PAGE_TITLE,
  TRIBES_RETRY,
  TRIBE_FEED_LINK,
} from "@yunicity/utils";
import Link from "next/link";

export function TribesScreen() {
  const { user } = useAuth();
  const city = user?.city ?? "Reims";
  const { items, loading, error, reload } = useTribesList(city);

  return (
    <WebAppShell
      contentWidth="wide"
      context={
        <aside className="space-y-3 text-sm text-neutral-600">
          <p className="font-semibold text-neutral-900">Le fil local d’abord</p>
          <p>
            Les tribus complètent la ville sans la remplacer. Votre fil reste le cœur de Yunicity.
          </p>
          <Link href="/feed" className="font-medium text-yunicity-primary hover:underline">
            {TRIBE_FEED_LINK}
          </Link>
        </aside>
      }
    >
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">{TRIBES_PAGE_TITLE}</h1>
        <p className="mt-2 text-neutral-600">{TRIBES_PAGE_SUBTITLE}</p>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="h-64 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-50"
              aria-hidden
            />
          ))}
          <p className="sr-only">{TRIBES_LOADING}</p>
        </div>
      ) : null}

      {error ? (
        <div className="space-y-3">
          <p className="text-sm text-neutral-700">{error}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
          >
            {TRIBES_RETRY}
          </button>
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-yunicity-border bg-yunicity-surface px-6 py-8 text-neutral-600">
          {TRIBES_EMPTY}
        </p>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className="grid gap-6 sm:grid-cols-2">
          {items.map((tribe) => (
            <li key={tribe.id}>
              <TribeCard tribe={tribe} city={city} />
            </li>
          ))}
        </ul>
      ) : null}
    </WebAppShell>
  );
}
