import type { AdminAnalyticsPeriod } from "@yunicity/types";
import { CalendarDays, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PERIOD_OPTIONS: { value: AdminAnalyticsPeriod; label: string }[] = [
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "90d", label: "90 derniers jours" },
];

interface AnalyticsPeriodFilterProps {
  period: AdminAnalyticsPeriod;
  periodLabel: string;
  isLoading: boolean;
  onChange: (period: AdminAnalyticsPeriod) => void;
}

export function AnalyticsPeriodFilter({
  period,
  periodLabel,
  isLoading,
  onChange,
}: AnalyticsPeriodFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        disabled={isLoading}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-xl border border-[#E7EAF3] bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-stone-50 disabled:opacity-60"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <CalendarDays className="h-4 w-4 text-violet-600" aria-hidden />
        <span className="tabular-nums">{periodLabel}</span>
        <ChevronDown className="h-4 w-4 text-stone-400" aria-hidden />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-20 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-[#E7EAF3] bg-white py-1 shadow-lg"
        >
          {PERIOD_OPTIONS.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={period === option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={
                  period === option.value
                    ? "w-full px-3 py-2 text-left text-sm font-medium text-violet-700 bg-violet-50"
                    : "w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
                }
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
