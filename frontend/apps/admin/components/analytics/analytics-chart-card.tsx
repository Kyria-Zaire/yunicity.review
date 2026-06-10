import type { ReactNode } from "react";

interface AnalyticsChartCardProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function AnalyticsChartCard({
  title,
  children,
  action,
  className = "",
}: AnalyticsChartCardProps) {
  return (
    <section
      className={`rounded-2xl border border-[#E7EAF3] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
