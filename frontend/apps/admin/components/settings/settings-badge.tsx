import { cn } from "@/lib/utils";

export type SettingsBadgeVariant = "active" | "read-only" | "soon" | "protected";

const VARIANT_STYLES: Record<SettingsBadgeVariant, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "read-only": "border-slate-200 bg-slate-50 text-slate-700",
  soon: "border-amber-200 bg-amber-50 text-amber-800",
  protected: "border-violet-200 bg-violet-50 text-violet-800",
};

const VARIANT_LABELS: Record<SettingsBadgeVariant, string> = {
  active: "Actif",
  "read-only": "Read-only",
  soon: "Bientôt",
  protected: "Protégé",
};

interface SettingsBadgeProps {
  variant: SettingsBadgeVariant;
  className?: string;
}

export function SettingsBadge({ variant, className }: SettingsBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {VARIANT_LABELS[variant]}
    </span>
  );
}
