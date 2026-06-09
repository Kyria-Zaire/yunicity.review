import type { PartnerStorytellingCopy } from "@yunicity/utils";
import Link from "next/link";

type PartnersEmptyStateProps = PartnerStorytellingCopy & {
  badge?: string;
  footnote?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
};

export function PartnersEmptyState({
  title,
  message,
  badge,
  footnote,
  action,
}: PartnersEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/40 px-6 py-16 text-center">
      {badge ? (
        <span className="inline-flex rounded-full bg-yunicity-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yunicity-primary">
          {badge}
        </span>
      ) : null}
      <p className={`text-lg font-semibold tracking-tight text-stone-900 ${badge ? "mt-4" : ""}`}>
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-600">{message}</p>
      {footnote ? (
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-500">{footnote}</p>
      ) : null}
      {action ? (
        <div className="mt-6">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
            >
              {action.label}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
