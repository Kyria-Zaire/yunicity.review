import type {
  AdminCockpitAttention,
  AdminCockpitExecutive,
  AdminCockpitPartners,
  AdminCockpitSignals,
} from "@yunicity/types";
import {
  cockpitOverviewHint,
  cockpitOverviewZeroHint,
  formatAdminMetric,
} from "@yunicity/utils";
import {
  CalendarDays,
  IdCard,
  PenLine,
  Store,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const OVERVIEW_ITEMS: {
  key: "users" | "passports" | "partners" | "offers" | "creators" | "events";
  label: string;
  field: keyof AdminCockpitExecutive;
  icon: LucideIcon;
}[] = [
  { key: "users", label: "Citoyens", field: "users_total", icon: Users },
  { key: "passports", label: "Passports", field: "passports_total", icon: IdCard },
  { key: "partners", label: "Partenaires", field: "partners_total", icon: Store },
  { key: "offers", label: "Offres", field: "offers_total", icon: Tag },
  { key: "creators", label: "Créateurs", field: "creator_contents_total", icon: PenLine },
  { key: "events", label: "Événements", field: "events_total", icon: CalendarDays },
];

interface CockpitOverviewGridProps {
  executive: AdminCockpitExecutive;
  attention: AdminCockpitAttention;
  partners: AdminCockpitPartners;
  signals: AdminCockpitSignals;
}

export function CockpitOverviewGrid({
  executive,
  attention,
  partners,
  signals,
}: CockpitOverviewGridProps) {
  return (
    <section aria-labelledby="cockpit-overview-title">
      <h2 id="cockpit-overview-title" className="text-[10px] font-medium uppercase tracking-wide text-stone-400">
        Photographie globale
      </h2>
      <div className="mt-1.5 grid gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {OVERVIEW_ITEMS.map((item) => {
          const Icon = item.icon;
          const value = executive[item.field];
          const hint =
            value > 0
              ? cockpitOverviewHint(item.key, executive, attention, partners, signals)
              : cockpitOverviewZeroHint(item.key);
          return (
            <div
              key={item.key}
              className="flex items-center gap-2 rounded-md border border-stone-100 bg-stone-50/50 px-2 py-1.5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white text-stone-400">
                <Icon className="h-3 w-3" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-semibold uppercase tracking-wide text-stone-400">
                  {item.label}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums leading-tight",
                    value > 0 ? "text-stone-800" : "text-stone-500",
                  )}
                >
                  {formatAdminMetric(value)}
                </p>
                {hint ? (
                  <p
                    className={cn(
                      "truncate text-[9px]",
                      value > 0 ? "font-medium text-emerald-700" : "text-stone-400",
                    )}
                  >
                    {hint}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
