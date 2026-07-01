"use client";

import type { CreateHubAction } from "@/lib/create-hub/create-hub-actions";
import { ChevronRight } from "lucide-react";

type CreateHubActionRowProps = {
  action: CreateHubAction;
  onSelect: (action: CreateHubAction) => void;
};

export function CreateHubActionRow({ action, onSelect }: CreateHubActionRowProps) {
  const Icon = action.icon;
  const isNavigable = action.kind === "navigate" && Boolean(action.href);

  return (
    <button
      type="button"
      onClick={() => isNavigable && onSelect(action)}
      disabled={!isNavigable}
      aria-disabled={!isNavigable}
      className={`flex w-full items-center gap-4 rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
        isNavigable
          ? "hover:border-neutral-300 hover:shadow-sm"
          : "cursor-default opacity-80"
      }`}
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF0FF] text-yunicity-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-neutral-900">{action.title}</span>
          {!isNavigable && action.soonLabel ? (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
              {action.soonLabel}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-neutral-500">{action.description}</span>
      </span>
      {isNavigable ? (
        <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300" aria-hidden />
      ) : null}
    </button>
  );
}
