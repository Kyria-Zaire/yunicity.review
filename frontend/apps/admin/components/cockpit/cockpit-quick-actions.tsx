import Link from "next/link";

const ACTIONS = [
  { href: "/passport-offers", label: "Modérer offres" },
  { href: "/creator-content", label: "Modérer contenus" },
  { href: "/partners?tab=leads", label: "Leads terrain" },
  { href: "/partner-scan", label: "Scanner offre" },
  { href: "/passport-offers/new", label: "Créer offre admin" },
] as const;

export function CockpitQuickActions() {
  return (
    <section aria-labelledby="cockpit-actions-title">
      <h2 id="cockpit-actions-title" className="text-sm font-semibold text-stone-900">
        Actions rapides
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
