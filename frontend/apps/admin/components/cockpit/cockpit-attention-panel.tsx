import type { AdminCockpitAttention } from "@yunicity/types";
import { cockpitAttentionTotal, formatAdminMetric } from "@yunicity/utils";
import {
  CalendarDays,
  Flag,
  PenLine,
  Store,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

type AttentionRow = {
  count: number;
  label: string;
  href: string;
  icon: LucideIcon;
};

function buildAttentionRows(attention: AdminCockpitAttention): AttentionRow[] {
  const rows: AttentionRow[] = [
    {
      count: attention.offers_pending,
      label: "offre(s) à valider",
      href: "/passport-offers?status=pending_review",
      icon: Tag,
    },
    {
      count: attention.creator_contents_pending,
      label: "contenu(s) créateur en attente",
      href: "/creator-content?status=pending_review",
      icon: PenLine,
    },
    {
      count: attention.events_pending,
      label: "événement(s) à valider",
      href: "/events?status=pending_review",
      icon: CalendarDays,
    },
    {
      count: attention.organizations_pending_review,
      label: "partenaire(s) à vérifier",
      href: "/partners?tab=verification",
      icon: Store,
    },
    {
      count: attention.partner_leads_open,
      label: "lead(s) terrain ouvert(s)",
      href: "/partners?tab=leads",
      icon: Users,
    },
    {
      count: attention.reports_pending,
      label: "signalement(s) citoyen",
      href: "/moderation?status=pending",
      icon: Flag,
    },
  ];
  return rows.filter((row) => row.count > 0);
}

interface CockpitAttentionPanelProps {
  attention: AdminCockpitAttention;
  city: string;
}

export function CockpitAttentionPanel({ attention, city }: CockpitAttentionPanelProps) {
  const total = cockpitAttentionTotal(attention);
  const rows = buildAttentionRows(attention);

  if (rows.length === 0) {
    return (
      <section
        className="rounded-lg border border-stone-100 bg-stone-50/40 px-3 py-2"
        aria-labelledby="cockpit-attention-title"
      >
        <h2 id="cockpit-attention-title" className="text-[10px] font-medium uppercase tracking-wide text-stone-400">
          Détail des files — {city}
        </h2>
        <p className="mt-0.5 text-xs text-stone-500">
          Aucune file en attente. Le Signal Yunicity résume l&apos;état du territoire.
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border border-stone-200 bg-white px-3 py-2.5"
      aria-labelledby="cockpit-attention-title"
    >
      <h2 id="cockpit-attention-title" className="text-[10px] font-medium uppercase tracking-wide text-stone-400">
        Détail des files
        {total > 0 ? (
          <span className="ml-1.5 tabular-nums text-stone-600">({formatAdminMetric(total)})</span>
        ) : null}
      </h2>
      <ul className="mt-1.5 space-y-1">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.href}>
              <Link
                href={row.href}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs text-stone-700 transition-colors duration-150 hover:bg-stone-50"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-stone-400" aria-hidden />
                  <span className="truncate">
                    <strong className="font-semibold tabular-nums text-stone-900">
                      {formatAdminMetric(row.count)}
                    </strong>{" "}
                    {row.label}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] font-medium text-yunicity-primary">→</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
