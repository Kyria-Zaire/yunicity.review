"use client";

type PassportEmptyStateProps = {
  title: string;
  description: string;
};

export function PassportEmptyState({ title, description }: PassportEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-5 py-8 text-center">
      <p className="text-sm font-semibold text-neutral-800">{title}</p>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
    </div>
  );
}
