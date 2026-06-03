import type { AdminCockpitAttention } from "@yunicity/types";
import {
  cockpitAttentionLabel,
  cockpitAttentionSeverity,
  formatAdminMetric,
  type CockpitAttentionKey,
} from "@yunicity/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";

type AttentionItem = {
  key: CockpitAttentionKey;
  count: number;
  href?: string;
  disabled?: boolean;
  disabledReason?: string;
};

function severityClasses(severity: ReturnType<typeof cockpitAttentionSeverity>): string {
  switch (severity) {
    case "high":
      return "border-rose-200 bg-rose-50/80 hover:border-rose-300";
    case "medium":
      return "border-amber-200 bg-amber-50/80 hover:border-amber-300";
    case "low":
      return "border-stone-200 bg-stone-50 hover:border-stone-300";
    default:
      return "border-stone-200 bg-white hover:border-stone-300";
  }
}

function AttentionCard({ item }: { item: AttentionItem }) {
  const severity = cockpitAttentionSeverity(item.count);
  const label = cockpitAttentionLabel(item.key);
  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-stone-900">
        {formatAdminMetric(item.count)}
      </p>
      {item.disabled ? (
        <p className="mt-2 text-xs text-stone-500">{item.disabledReason ?? "Bientôt disponible"}</p>
      ) : (
        <p className="mt-2 text-xs font-medium text-stone-700">Voir la file →</p>
      )}
    </>
  );

  const className = cn(
    "block rounded-xl border p-4 shadow-sm transition",
    severityClasses(severity),
    item.disabled && "cursor-not-allowed opacity-70",
  );

  if (item.disabled || !item.href) {
    return (
      <div className={className} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  );
}

export function CockpitAttention({ attention }: { attention: AdminCockpitAttention }) {
  const items: AttentionItem[] = [
    {
      key: "offers_pending",
      count: attention.offers_pending,
      href: "/passport-offers?status=pending_review",
    },
    {
      key: "creator_contents_pending",
      count: attention.creator_contents_pending,
      href: "/creator-content?status=pending_review",
    },
    {
      key: "events_pending",
      count: attention.events_pending,
      disabled: true,
      disabledReason: "Modération événements — route à venir",
    },
    {
      key: "partner_leads_open",
      count: attention.partner_leads_open,
      href: "/partners?tab=leads",
    },
    {
      key: "organizations_pending_review",
      count: attention.organizations_pending_review,
      disabled: true,
      disabledReason: "Vérification organisations — bientôt",
    },
  ];

  return (
    <section aria-labelledby="cockpit-attention-title">
      <h2 id="cockpit-attention-title" className="text-sm font-semibold text-stone-900">
        À traiter
      </h2>
      <p className="mt-1 text-xs text-stone-500">Files de modération et suivi terrain</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {items.map((item) => (
          <AttentionCard key={item.key} item={item} />
        ))}
      </div>
    </section>
  );
}
