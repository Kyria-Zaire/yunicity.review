import type { LocalEvent } from "@yunicity/types";
import { eventPartnerBadgeLabel } from "@yunicity/utils";

type PartnerEventBadgeProps = {
  event: LocalEvent;
  /** "light" sur fond blanc/clair, "dark" sur fond sombre (hero) */
  variant?: "light" | "dark";
};

/**
 * Badge discret identifiant un événement comme moment partenaire Yunicity.
 * Retourne null si l'event n'est pas un partner event.
 */
export function PartnerEventBadge({
  event,
  variant = "light",
}: PartnerEventBadgeProps) {
  const label = eventPartnerBadgeLabel(event);
  if (!label) return null;

  const cls =
    variant === "dark"
      ? "border border-white/30 bg-white/20 text-white/95"
      : "border border-yunicity-primary/25 bg-yunicity-primary/10 text-yunicity-primary";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}
      aria-label={label}
    >
      {label}
    </span>
  );
}
