import {
  CalendarDays,
  IdCard,
  PenLine,
  QrCode,
  Store,
  Tag,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const ACTIONS: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}[] = [
  {
    href: "/partners",
    label: "Gérer partenaires",
    description: "Fiches, readiness, activation",
    icon: Store,
    tone: "bg-yunicity-primary-soft text-yunicity-primary",
  },
  {
    href: "/passport-offers?status=pending_review",
    label: "Modérer offres",
    description: "Validation et publication",
    icon: Tag,
    tone: "bg-rose-50 text-rose-700",
  },
  {
    href: "/events?status=pending_review",
    label: "Modérer événements",
    description: "Approuver, refuser, annuler",
    icon: CalendarDays,
    tone: "bg-amber-50 text-amber-800",
  },
  {
    href: "/passport-ops",
    label: "Passport Ops",
    description: "Recherche et statuts",
    icon: IdCard,
    tone: "bg-sky-50 text-sky-800",
  },
  {
    href: "/creator-content?status=pending_review",
    label: "Modérer contenus",
    description: "Créateurs partenaires",
    icon: PenLine,
    tone: "bg-emerald-50 text-emerald-800",
  },
  {
    href: "/partner-scan",
    label: "Scanner Passport",
    description: "Validation QR / tampons",
    icon: QrCode,
    tone: "bg-stone-100 text-stone-800",
  },
];

export function CockpitQuickActions() {
  return (
    <section aria-labelledby="cockpit-actions-title">
      <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">
        Quels outils utiliser ?
      </p>
      <h2 id="cockpit-actions-title" className="text-xs font-semibold text-stone-600">
        Actions rapides
      </h2>
      <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-start gap-2.5 rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm transition-all duration-150 hover:border-stone-300 hover:bg-stone-50/60 hover:shadow"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${action.tone}`}
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-tight text-stone-900">
                  {action.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-stone-500">
                  {action.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
