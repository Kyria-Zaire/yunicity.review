import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface EventDetailCardProps {
  title: string;
  subtitle?: string;
  headerAction?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function EventDetailCard({
  title,
  subtitle,
  headerAction,
  className,
  children,
}: EventDetailCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-yunicity-border bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-yunicity-ink">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-yunicity-ink-muted">{subtitle}</p>
          ) : null}
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
