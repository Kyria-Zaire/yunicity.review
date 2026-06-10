import { formatAdminMetric } from "@yunicity/utils";

import type { AnalyticsDonutSegment } from "@/lib/analytics-display";

interface AnalyticsDonutChartProps {
  segments: AnalyticsDonutSegment[];
  centerLabel: string;
  centerValue: string;
  emptyMessage: string;
}

function buildConicGradient(segments: AnalyticsDonutSegment[], total: number): string {
  let offset = 0;
  const stops = segments
    .filter((segment) => segment.value > 0)
    .map((segment) => {
      const slice = (segment.value / total) * 100;
      const start = offset;
      offset += slice;
      return `${segment.color} ${start}% ${offset}%`;
    });
  return stops.join(", ");
}

export function AnalyticsDonutChart({
  segments,
  centerLabel,
  centerValue,
  emptyMessage,
}: AnalyticsDonutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total <= 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 text-center">
        <p className="text-sm font-medium text-stone-700">{emptyMessage}</p>
      </div>
    );
  }

  const gradient = buildConicGradient(segments, total);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative h-40 w-40 shrink-0">
        <div
          className="h-full w-full rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
          role="img"
          aria-label={`${centerLabel} : ${centerValue}`}
        />
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white text-center">
          <p className="text-lg font-bold tabular-nums text-stone-950">{centerValue}</p>
          <p className="text-[11px] text-stone-500">{centerLabel}</p>
        </div>
      </div>
      <ul className="w-full max-w-xs space-y-2.5">
        {segments.map((segment) => {
          const percent = total > 0 ? (segment.value / total) * 100 : 0;
          return (
            <li key={segment.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: segment.color }}
                  aria-hidden
                />
                <span className="truncate text-stone-600">{segment.label}</span>
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-stone-900">
                {formatAdminMetric(segment.value)}{" "}
                <span className="text-xs font-normal text-stone-500">
                  ({percent.toFixed(1)} %)
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
