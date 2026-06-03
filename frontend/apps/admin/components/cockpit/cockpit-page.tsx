"use client";

import { CockpitAttention } from "@/components/cockpit/cockpit-attention";
import { CockpitExecutiveOverview } from "@/components/cockpit/cockpit-executive-overview";
import { CockpitHeader } from "@/components/cockpit/cockpit-header";
import { CockpitPartnersSnapshot } from "@/components/cockpit/cockpit-partners-snapshot";
import { CockpitPassportSnapshot } from "@/components/cockpit/cockpit-passport-snapshot";
import { CockpitQuickActions } from "@/components/cockpit/cockpit-quick-actions";
import { useAdminCockpitSummary } from "@/lib/hooks/use-admin-cockpit-summary";

const COCKPIT_CITY = "Reims";

function CockpitLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-pulse" aria-busy="true">
      <div className="h-24 rounded-xl bg-stone-100" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl bg-stone-100" />
        ))}
      </div>
      <div className="h-40 rounded-xl bg-stone-100" />
    </div>
  );
}

export function CockpitPage() {
  const { data, isLoading, error, reload } = useAdminCockpitSummary(COCKPIT_CITY);

  if (isLoading && !data) {
    return <CockpitLoading />;
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-lg font-semibold text-rose-900">Cockpit indisponible</h2>
        <p className="mt-2 text-sm text-rose-800" role="alert">
          {error}
        </p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-4 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <CockpitHeader
        city={data.city}
        generatedAt={data.generated_at}
        onRefresh={() => void reload()}
        isRefreshing={isLoading}
      />
      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error} — données affichées depuis la dernière charge réussie.
        </p>
      ) : null}
      <CockpitExecutiveOverview executive={data.executive} />
      <CockpitAttention attention={data.attention} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CockpitPartnersSnapshot partners={data.partners} />
        <CockpitPassportSnapshot passport={data.passport} />
      </div>
      <CockpitQuickActions />
    </div>
  );
}
