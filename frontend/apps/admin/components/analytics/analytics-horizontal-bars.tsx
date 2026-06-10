import { formatAdminMetric } from "@yunicity/utils";

import type { AnalyticsModuleBar } from "@/lib/analytics-display";

interface AnalyticsHorizontalBarsProps {
  items: AnalyticsModuleBar[];
  emptyMessage: string;
}

export function AnalyticsHorizontalBars({ items, emptyMessage }: AnalyticsHorizontalBarsProps) {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  if (maxValue <= 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 text-center text-sm text-stone-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const width = Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 0);
        return (
          <li key={item.id}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="text-stone-600">{item.label}</span>
              <span className="font-semibold tabular-nums text-stone-900">
                {formatAdminMetric(item.value)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${width}%`, backgroundColor: item.color }}
                role="presentation"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
