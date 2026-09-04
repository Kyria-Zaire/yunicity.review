"use client";

import { WEB_CITIZEN_SEARCH_ACCESS } from "@/lib/layout/web-layout-config";
import { searchPlaceholderForCity } from "@yunicity/utils";
import { Search, X } from "lucide-react";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

const PILL_CLASS =
  "inline-flex min-h-11 max-w-full items-center gap-2.5 rounded-full border border-neutral-200/90 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition focus-within:border-yunicity-primary/35 focus-within:ring-2 focus-within:ring-yunicity-primary/15 hover:border-neutral-300";

type ExplorerSearchPillButtonProps = {
  mode: "button";
  label?: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  ariaExpanded?: boolean;
  ariaBusy?: boolean;
  disabled?: boolean;
  trailing?: ReactNode;
  className?: string;
  controlId?: string;
};

type ExplorerSearchPillInputProps = {
  mode: "input";
  city: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  className?: string;
  inputId?: string;
};

export type ExplorerSearchPillProps = ExplorerSearchPillButtonProps | ExplorerSearchPillInputProps;

export function ExplorerSearchPill(props: ExplorerSearchPillProps) {
  if (props.mode === "button") {
    const label = props.label ?? WEB_CITIZEN_SEARCH_ACCESS.label;
    return (
      <button
        type="button"
        onClick={props.onClick}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={props.ariaExpanded}
        aria-busy={props.ariaBusy}
        disabled={props.disabled}
        data-yunicity-header-control={props.controlId ?? "explorer"}
        className={`${PILL_CLASS} disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ""}`}
      >
        <Search className="h-[18px] w-[18px] shrink-0 text-yunicity-primary" strokeWidth={2} aria-hidden />
        <span className="truncate whitespace-nowrap">{label}</span>
        {props.trailing}
      </button>
    );
  }

  const placeholder = searchPlaceholderForCity(props.city);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      props.onSubmit?.();
    }
  };

  return (
    <div className={`${PILL_CLASS} w-full min-w-[12rem] sm:max-w-md ${props.className ?? ""}`}>
      <Search className="h-[18px] w-[18px] shrink-0 text-yunicity-primary" strokeWidth={2} aria-hidden />
      <label className="sr-only" htmlFor={props.inputId ?? "search-desktop-q"}>
        {WEB_CITIZEN_SEARCH_ACCESS.label}
      </label>
      <input
        id={props.inputId ?? "search-desktop-q"}
        type="search"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-neutral-800 outline-none placeholder:font-normal placeholder:text-neutral-500"
      />
      {props.value ? (
        <button
          type="button"
          onClick={() => props.onChange("")}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Effacer la recherche"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
