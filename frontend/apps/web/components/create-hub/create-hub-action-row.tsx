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
      className={`flex w-full gap-2.5 rounded-lg border border-neutral-200/90 bg-neutral-50/50 px-2.5 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
        isNavigable ? "items-center" : "items-start"
      } ${
        isNavigable
          ? "hover:border-neutral-300 hover:bg-white hover:shadow-sm"
          : "cursor-default opacity-80"
      }`}
    >
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EEF0FF] text-yunicity-primary ${
          isNavigable ? "" : "mt-px"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-sm font-semibold leading-snug text-neutral-900">
          {action.title}
          {!isNavigable && action.soonLabel ? (
            <span className="ml-1.5 inline-flex translate-y-[-0.5px] items-center rounded-full bg-neutral-200/70 px-2 py-0.5 text-xs font-semibold leading-none text-neutral-500">
              {action.soonLabel}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-neutral-500">{action.description}</span>
      </span>
      {isNavigable ? (
        <ChevronRight className="h-4 w-4 shrink-0 self-center text-neutral-300" aria-hidden />
      ) : null}
    </button>
  );
}
