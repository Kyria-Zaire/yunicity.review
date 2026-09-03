"use client";

import {
  REGISTER_DESKTOP_ACCOUNT_COPY,
  REGISTER_DESKTOP_ACCOUNT_TYPE_IDS,
  REGISTER_DESKTOP_COPY,
} from "@/lib/auth/register-desktop-contract";
import type { RegisterDesktopAccountTypeId } from "@/lib/auth/register-desktop-contract";
import type { RegisterAccountTypeId } from "@yunicity/utils";
import {
  Briefcase,
  GraduationCap,
  Home,
  Store,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

const ACCOUNT_ICONS: Record<RegisterDesktopAccountTypeId, LucideIcon> = {
  citizen: Home,
  commerce: Store,
  association: UsersRound,
  school: GraduationCap,
  other: Briefcase,
};

type RegisterPortalAccountTypeGridProps = {
  selected: RegisterAccountTypeId | null;
  onSelect: (accountType: RegisterAccountTypeId) => void;
  layout?: "grid" | "stack";
  showSectionHeading?: boolean;
};

export function RegisterPortalAccountTypeGrid({
  selected,
  onSelect,
  layout = "grid",
  showSectionHeading = true,
}: RegisterPortalAccountTypeGridProps) {
  const listClass = layout === "stack" ? "flex flex-col gap-3" : "grid gap-3 sm:grid-cols-2";

  return (
    <div>
      {showSectionHeading ? (
        <>
          <h2 className="text-lg font-bold text-neutral-950">{REGISTER_DESKTOP_COPY.typeTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {REGISTER_DESKTOP_COPY.typeSubtitle}
          </p>
        </>
      ) : null}

      <div className={`${showSectionHeading ? "mt-5" : ""} ${listClass}`}>
        {REGISTER_DESKTOP_ACCOUNT_TYPE_IDS.map((id) => {
          const copy = REGISTER_DESKTOP_ACCOUNT_COPY[id];
          if (!copy) return null;
          const Icon = ACCOUNT_ICONS[id];
          const active = selected === id;

          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(id)}
              data-register-portal-account-type={id}
              className={`relative w-full rounded-2xl border p-4 text-left transition hover:border-neutral-300 ${
                active
                  ? "border-yunicity-primary bg-yunicity-primary/5 shadow-sm"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <span
                className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  active ? "border-yunicity-primary" : "border-neutral-300"
                }`}
                aria-hidden
              >
                {active ? <span className="h-2.5 w-2.5 rounded-full bg-yunicity-primary" /> : null}
              </span>

              <div className="flex items-start gap-3 pr-6">
                <span
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${copy.iconClassName}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-neutral-950">{copy.title}</span>
                    {copy.badge ? (
                      <span className="rounded-full bg-yunicity-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yunicity-primary">
                        {copy.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">{copy.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
