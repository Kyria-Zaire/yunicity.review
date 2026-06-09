import type { AdminPartnersWorkspaceSummary } from "@yunicity/types";
import { partnerTerrainKpiCards } from "@yunicity/utils";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

const TONE_STYLES = {
  primary: {
    icon: "bg-yunicity-primary-soft text-yunicity-primary",
    link: "text-yunicity-primary",
  },
  success: {
    icon: "bg-emerald-50 text-emerald-700",
    link: "text-emerald-700",
  },
  warning: {
    icon: "bg-amber-50 text-amber-700",
    link: "text-amber-700",
  },
  info: {
    icon: "bg-sky-50 text-sky-700",
    link: "text-sky-700",
  },
  danger: {
    icon: "bg-rose-50 text-rose-700",
    link: "text-rose-700",
  },
} as const;

function KpiIcon({ tone }: { tone: keyof typeof TONE_STYLES }) {
  const className = "h-5 w-5";
  switch (tone) {
    case "primary":
      return <Users className={className} aria-hidden />;
    case "success":
      return <CheckCircle2 className={className} aria-hidden />;
    case "warning":
      return <Clock3 className={className} aria-hidden />;
    case "info":
      return <MapPin className={className} aria-hidden />;
    case "danger":
      return <ShieldCheck className={className} aria-hidden />;
  }
}

export function PartnersKpiStrip({ summary }: { summary: AdminPartnersWorkspaceSummary }) {
  const cards = partnerTerrainKpiCards(summary);

  return (
    <section
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      aria-label="Indicateurs réseau partenaires"
    >
      {cards.map((card) => {
        const styles = TONE_STYLES[card.tone];
        return (
          <article
            key={card.id}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-stone-500">{card.label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-stone-950 tabular-nums">
                  {card.value}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    card.hint.startsWith("+") ? "font-medium text-emerald-700" : "text-stone-500"
                  }`}
                >
                  {card.hint}
                </p>
              </div>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
              >
                <KpiIcon tone={card.tone} />
              </span>
            </div>
            <Link
              href={card.href}
              className={`mt-4 inline-flex items-center gap-1 text-xs font-medium ${styles.link}`}
            >
              {card.id === "total"
                ? "Voir tous les partenaires"
                : card.id === "active"
                  ? "Voir les actifs"
                  : card.id === "pending"
                    ? "Voir les en attente"
                    : card.id === "city"
                      ? "Territoire pilote"
                      : "Voir les vérifiés"}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </article>
        );
      })}
    </section>
  );
}
