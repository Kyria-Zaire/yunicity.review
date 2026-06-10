import type { StaffOrganizationalHealth } from "@yunicity/utils";
import { Check, Circle } from "lucide-react";

interface StaffOrganizationalHealthProps {
  health: StaffOrganizationalHealth;
}

function progressBarTone(percent: number): string {
  if (percent >= 100) {
    return "bg-emerald-500";
  }
  if (percent >= 67) {
    return "bg-yunicity-primary";
  }
  if (percent >= 34) {
    return "bg-amber-500";
  }
  return "bg-rose-500";
}

export function StaffOrganizationalHealth({ health }: StaffOrganizationalHealthProps) {
  const progressRatio = health.presentRolesCount / health.totalRoles;

  return (
    <section
      className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
      aria-labelledby="staff-organizational-health-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 shrink-0 sm:w-56">
          <h2
            id="staff-organizational-health-title"
            className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500"
          >
            Santé organisationnelle
          </h2>
          <p className="mt-0.5 text-sm font-medium text-stone-800">
            {health.presentRolesCount} / {health.totalRoles} rôles critiques couverts
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="h-2 overflow-hidden rounded-full bg-stone-100"
            role="progressbar"
            aria-valuenow={health.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Couverture des rôles critiques : ${health.percent} pourcent`}
          >
            <div
              className={`h-full rounded-full transition-all ${progressBarTone(health.percent)}`}
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-stone-600">{health.message}</p>
        </div>

        <p className="shrink-0 text-xl font-bold tabular-nums text-stone-950 sm:w-14 sm:text-right">
          {health.percent}%
        </p>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-700">
        {health.roles.map((item) => (
          <li key={item.role} className="inline-flex items-center gap-1.5">
            {item.present ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
            ) : (
              <Circle className="h-3.5 w-3.5 text-stone-300" aria-hidden />
            )}
            <span className={item.present ? "text-stone-800" : "text-stone-500"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-[11px] text-stone-400">
        Indicateur gouvernance — UX uniquement.
      </p>
    </section>
  );
}
