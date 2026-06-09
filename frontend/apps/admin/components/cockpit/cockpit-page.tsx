"use client";

import { CockpitAttentionPanel } from "@/components/cockpit/cockpit-attention-panel";
import { CockpitOverviewGrid } from "@/components/cockpit/cockpit-overview-grid";
import { CockpitPassportHealth } from "@/components/cockpit/cockpit-passport-health";
import { CockpitQuickActions } from "@/components/cockpit/cockpit-quick-actions";
import { CockpitRecentActivity } from "@/components/cockpit/cockpit-recent-activity";
import { CockpitTerritoryMapCard } from "@/components/cockpit/cockpit-territory-map-card";
import { CockpitTerritoryPulse } from "@/components/cockpit/cockpit-territory-pulse";
import { CockpitWelcomeHeader } from "@/components/cockpit/cockpit-welcome-header";
import { CockpitYunicitySignal } from "@/components/cockpit/cockpit-yunicity-signal";
import { useAuth } from "@/lib/auth/auth-provider";
import { useAdminCockpitSummary } from "@/lib/hooks/use-admin-cockpit-summary";

const COCKPIT_CITY = "Reims";

function CockpitLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 animate-pulse pb-8" aria-busy="true">
      <div className="h-16 rounded-xl bg-stone-100" />
      <div className="h-24 rounded-xl bg-stone-100" />
      <div className="h-28 rounded-2xl bg-stone-100" />
      <div className="h-12 rounded-lg bg-stone-100" />
      <div className="h-20 rounded-xl bg-stone-100" />
      <div className="grid gap-1 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-10 rounded-md bg-stone-100" />
        ))}
      </div>
    </div>
  );
}

export function CockpitPage() {
  const { user } = useAuth();
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
    <div className="mx-auto max-w-6xl space-y-5 pb-8">
      <CockpitWelcomeHeader
        userName={user?.full_name}
        userEmail={user?.email}
        city={data.city}
        attention={data.attention}
        onRefresh={() => void reload()}
        isRefreshing={isLoading}
      />

      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error} — données affichées depuis la dernière charge réussie.
        </p>
      ) : null}

      <CockpitYunicitySignal
        city={data.city}
        attention={data.attention}
        usersActive={data.executive.users_active}
        lastCheckedAt={data.generated_at}
      />

      <CockpitAttentionPanel attention={data.attention} city={data.city} />

      <CockpitTerritoryPulse
        city={data.city}
        executive={data.executive}
        partners={data.partners}
        signals={data.signals}
        attention={data.attention}
      />

      <CockpitRecentActivity />

      <CockpitOverviewGrid
        executive={data.executive}
        attention={data.attention}
        partners={data.partners}
        signals={data.signals}
      />

      <CockpitQuickActions />

      <CockpitPassportHealth passport={data.passport} signals={data.signals} />

      <CockpitTerritoryMapCard city={data.city} executive={data.executive} />
    </div>
  );
}
