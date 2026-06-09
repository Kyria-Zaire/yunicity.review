"use client";

import type { AdminPartnersWorkspaceSummary } from "@yunicity/types";
import {
  adminPartnerDetailPath,
  categoryBreakdownWithPercent,
  formatAdminMetric,
  partnerFutureNetworkSidebarCopy,
  partnerTerrainCategoryEmptyCopy,
  partnerTerrainMapEmptyCopy,
  partnerTerrainTopActiveEmptyCopy,
  partnerTypeLabel,
} from "@yunicity/utils";
import { MapPin, Tag, Trophy } from "lucide-react";
import Link from "next/link";

const CHART_COLORS = [
  "#2A2FFF",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#94a3b8",
];

function FutureNetworkCard() {
  const copy = partnerFutureNetworkSidebarCopy();

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-900">{copy.title}</h3>
      <ul className="mt-4 space-y-4">
        <li className="flex gap-3 text-sm text-stone-700">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden />
          <span>La carte apparaîtra ici.</span>
        </li>
        <li className="flex gap-3 text-sm text-stone-700">
          <Tag className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden />
          <span>Les catégories émergeront automatiquement.</span>
        </li>
        <li className="flex gap-3 text-sm text-stone-700">
          <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden />
          <span>Les partenaires les plus engagés se révéleront avec les usages Passport.</span>
        </li>
      </ul>
      <p className="mt-4 border-t border-stone-100 pt-4 text-xs leading-relaxed text-stone-500">
        {copy.footer}
      </p>
    </section>
  );
}

function TerrainMapPreview({
  city,
  pins,
}: {
  city: string;
  pins: AdminPartnersWorkspaceSummary["map_pins"];
}) {
  const mapEmpty = partnerTerrainMapEmptyCopy();
  const lats = pins.map((p) => p.latitude);
  const lngs = pins.map((p) => p.longitude);
  const minLat = lats.length ? Math.min(...lats) : 49.24;
  const maxLat = lats.length ? Math.max(...lats) : 49.27;
  const minLng = lngs.length ? Math.min(...lngs) : 4.0;
  const maxLng = lngs.length ? Math.max(...lngs) : 4.05;

  const mapHref = (() => {
    const base = (process.env.NEXT_PUBLIC_WEB_APP_URL ?? "").replace(/\/$/, "");
    return base ? `${base}/map?city=${encodeURIComponent(city)}` : null;
  })();

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-900">Carte des partenaires</h3>
      <div className="relative mt-3 min-h-[180px] overflow-hidden rounded-xl border border-stone-100 bg-stone-50">
        {pins.length === 0 ? (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center px-4 text-center">
            <MapPin className="mb-3 h-8 w-8 text-stone-300" aria-hidden />
            <p className="text-sm font-medium text-stone-800">{mapEmpty.title}</p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-stone-500">{mapEmpty.message}</p>
          </div>
        ) : (
          pins.map((pin) => {
            const top =
              maxLat === minLat
                ? 50
                : ((maxLat - pin.latitude) / (maxLat - minLat)) * 80 + 10;
            const left =
              maxLng === minLng
                ? 50
                : ((pin.longitude - minLng) / (maxLng - minLng)) * 80 + 10;
            return (
              <span
                key={pin.organization_id}
                title={pin.name}
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yunicity-primary shadow ring-2 ring-white"
                style={{ top: `${top}%`, left: `${left}%` }}
              />
            );
          })
        )}
      </div>
      {mapHref ? (
        <a
          href={mapHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-full rounded-xl border border-stone-200 py-2 text-center text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Voir la carte complète
        </a>
      ) : null}
    </section>
  );
}

function CategoryDonut({ summary }: { summary: AdminPartnersWorkspaceSummary }) {
  const breakdown = categoryBreakdownWithPercent(summary.category_breakdown);
  const total = breakdown.reduce((sum, item) => sum + item.count, 0);
  const categoryEmpty = partnerTerrainCategoryEmptyCopy();
  let cursor = 0;
  const gradient =
    breakdown.length > 0
      ? breakdown
          .map((item, index) => {
            const start = cursor;
            cursor += item.percent;
            return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${cursor}%`;
          })
          .join(", ")
      : "";

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-900">Répartition par catégorie</h3>
      {breakdown.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-medium text-stone-800">{categoryEmpty.title}</p>
          <p className="mt-2 text-xs leading-relaxed text-stone-500">{categoryEmpty.message}</p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-4">
            <div
              className="h-28 w-28 shrink-0 rounded-full"
              style={{ background: `conic-gradient(${gradient})` }}
              aria-hidden
            />
            <ul className="min-w-0 flex-1 space-y-1.5 text-xs text-stone-600">
              {breakdown.map((item, index) => (
                <li key={item.key} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="truncate">
                      {item.key.includes("_")
                        ? partnerTypeLabel(item.key as Parameters<typeof partnerTypeLabel>[0])
                        : item.key}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-stone-800">
                    {item.percent}% ({item.count})
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-xs text-stone-500">Total : {formatAdminMetric(total)}</p>
        </>
      )}
    </section>
  );
}

function TopActiveList({ summary }: { summary: AdminPartnersWorkspaceSummary }) {
  const topEmpty = partnerTerrainTopActiveEmptyCopy();

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-900">Top partenaires actifs</h3>
      <ol className="mt-3 space-y-3">
        {summary.top_active_partners.length === 0 ? (
          <li className="px-2 py-6 text-center">
            <p className="text-sm font-medium text-stone-800">{topEmpty.title}</p>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">{topEmpty.message}</p>
          </li>
        ) : (
          summary.top_active_partners.map((partner, index) => (
            <li key={partner.organization_id}>
              <Link
                href={adminPartnerDetailPath(partner.organization_id)}
                className="flex items-center gap-3 rounded-xl px-1 py-1 hover:bg-stone-50"
              >
                <span className="w-4 text-xs font-semibold text-stone-400">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">{partner.name}</p>
                  <p className="text-xs text-stone-500">
                    {formatAdminMetric(partner.interactions_count)} interactions
                  </p>
                </span>
              </Link>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}

export function PartnersTerrainInsights({ summary }: { summary: AdminPartnersWorkspaceSummary }) {
  if (summary.partners_total === 0) {
    return <FutureNetworkCard />;
  }

  return (
    <div className="space-y-4">
      <TerrainMapPreview city={summary.city} pins={summary.map_pins} />
      <CategoryDonut summary={summary} />
      <TopActiveList summary={summary} />
    </div>
  );
}
