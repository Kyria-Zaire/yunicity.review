import type { LucideIcon } from "lucide-react";

type KpiTone = "violet" | "green" | "orange" | "rose";

const TONE_STYLES: Record<KpiTone, { iconBg: string; iconText: string }> = {
  violet: { iconBg: "bg-violet-100", iconText: "text-violet-600" },
  green: { iconBg: "bg-emerald-100", iconText: "text-emerald-600" },
  orange: { iconBg: "bg-orange-100", iconText: "text-orange-600" },
  rose: { iconBg: "bg-rose-100", iconText: "text-rose-600" },
};

const VARIATION_STYLES = {
  positive: "text-emerald-600",
  negative: "text-rose-600",
  neutral: "text-stone-500",
} as const;

interface AnalyticsKpiCardProps {
  label: string;
  value: string;
  variation: string;
  variationTone: keyof typeof VARIATION_STYLES;
  icon: LucideIcon;
  tone: KpiTone;
}

export function AnalyticsKpiCard({
  label,
  value,
  variation,
  variationTone,
  icon: Icon,
  tone,
}: AnalyticsKpiCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <article className="flex items-center gap-4 rounded-2xl border border-[#E7EAF3] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${styles.iconBg} ${styles.iconText}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-stone-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-stone-950 tabular-nums">
          {value}
        </p>
        <p className={`mt-1 text-xs font-medium ${VARIATION_STYLES[variationTone]}`}>{variation}</p>
      </div>
    </article>
  );
}
