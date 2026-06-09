import type { AdminCockpitAttention, AdminCockpitExecutive } from "@yunicity/types";
import {
  cockpitCityMood,
  cockpitCityMoodLabel,
  cockpitModerationPendingTotal,
  formatAdminMetric,
} from "@yunicity/utils";
import { AlertCircle, Heart, Users } from "lucide-react";

interface CockpitStatusStripProps {
  executive: AdminCockpitExecutive;
  attention: AdminCockpitAttention;
}

export function CockpitStatusStrip({ executive, attention }: CockpitStatusStripProps) {
  const mood = cockpitCityMood(attention);
  const pending = cockpitModerationPendingTotal(attention);

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-sm">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yunicity-primary-soft text-yunicity-primary">
          <Users className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-stone-500">Citoyens actifs</p>
          <p className="text-sm font-semibold tabular-nums text-stone-900">
            {formatAdminMetric(executive.users_active)}
            <span className="ml-1 text-xs font-normal text-stone-500">
              / {formatAdminMetric(executive.users_total)}
            </span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-sm">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <AlertCircle className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-stone-500">Validations en attente</p>
          <p className="text-sm font-semibold tabular-nums text-stone-900">
            {formatAdminMetric(pending)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-sm">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            mood === "calm" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          <Heart className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-stone-500">État territoire</p>
          <p className="text-sm font-semibold text-stone-900">{cockpitCityMoodLabel(mood)}</p>
        </div>
      </div>
    </div>
  );
}
