import Link from "next/link";

const SHORTCUTS = [
  { href: "/staff", label: "Audits staff" },
  { href: "/passport-offers?status=pending_review", label: "Offres" },
  { href: "/events?status=pending_review", label: "Événements" },
  { href: "/creator-content?status=pending_review", label: "Contenus" },
] as const;

export function CockpitRecentActivity() {
  return (
    <p className="border-l-2 border-stone-200 py-0.5 pl-3 text-xs leading-relaxed text-stone-500">
      <span className="font-medium text-stone-600">Journal territorial bientôt disponible.</span>{" "}
      En attendant, suivez directement les files d&apos;exploitation :{" "}
      {SHORTCUTS.map((item, index) => (
        <span key={item.href}>
          {index > 0 ? " · " : null}
          <Link href={item.href} className="text-yunicity-primary hover:underline">
            {item.label}
          </Link>
        </span>
      ))}
      .
    </p>
  );
}
