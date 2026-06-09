"use client";

import { cockpitAttentionTotal, cockpitUserGreetingName, formatCockpitNowLabel } from "@yunicity/utils";
import { Map, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { AdminCockpitAttention } from "@yunicity/types";

interface CockpitWelcomeHeaderProps {
  userName: string | null | undefined;
  userEmail: string | null | undefined;
  city: string;
  attention: AdminCockpitAttention;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function CockpitWelcomeHeader({
  userName,
  userEmail,
  city,
  attention,
  onRefresh,
  isRefreshing,
}: CockpitWelcomeHeaderProps) {
  const greeting = cockpitUserGreetingName(userName, userEmail);
  const attentionTotal = cockpitAttentionTotal(attention);

  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">
            Bonjour {greeting} 👋
          </h1>
          <p className="mt-0.5 text-sm text-stone-600">
            {city} • {formatCockpitNowLabel()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {attentionTotal > 0 ? (
            <span
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-yunicity-primary px-2 text-xs font-semibold text-white"
              title="Éléments à traiter"
            >
              {attentionTotal}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
            {isRefreshing ? "…" : "Actualiser"}
          </button>
        </div>
      </div>

      <aside className="relative w-full overflow-hidden rounded-xl border border-yunicity-primary/30 border-l-4 border-l-yunicity-primary bg-yunicity-primary-soft p-4 shadow-md">
        <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/80 bg-white shadow-sm">
            <Image
              src="/brand/yunicity-mascot.png"
              alt=""
              fill
              className="object-contain p-0.5"
              sizes="56px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-snug text-stone-950">
              Yunicity, la vie de votre territoire
            </p>
            <p className="mt-0.5 text-sm text-stone-700">
              Pilotez {city} à partir de données réelles.
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">
            <Link
              href="/passport-ops"
              className="inline-flex items-center gap-1 rounded-md bg-yunicity-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-yunicity-primary-hover"
            >
              Voir Passport Ops
            </Link>
            <Link
              href="/partners"
              className="inline-flex items-center gap-1 rounded-md border border-yunicity-primary/30 bg-white px-2.5 py-1 text-xs font-medium text-yunicity-primary hover:bg-white/90"
            >
              <Map className="h-3 w-3" aria-hidden />
              Ouvrir le pilotage
            </Link>
          </div>
        </div>
      </aside>
    </header>
  );
}
