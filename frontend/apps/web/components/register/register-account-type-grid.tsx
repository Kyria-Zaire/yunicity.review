"use client";

import type { RegisterAccountTypeId } from "@yunicity/utils";
import {
  REGISTER_ACCOUNT_TYPE_OPTIONS,
  REGISTER_TYPE_INFO_BODY,
  REGISTER_TYPE_INFO_TITLE,
  REGISTER_TYPE_SECTION_SUBTITLE,
  REGISTER_TYPE_SECTION_TITLE,
} from "@yunicity/utils";
import {
  Building2,
  Check,
  GraduationCap,
  HeartHandshake,
  Store,
  Users,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ACCOUNT_ICONS: Record<RegisterAccountTypeId, LucideIcon> = {
  citizen: Users,
  commerce: Store,
  association: UsersRound,
  public_agency: Building2,
  school: GraduationCap,
  other: HeartHandshake,
};

type RegisterAccountTypeGridProps = {
  selected: RegisterAccountTypeId | null;
  onSelect: (accountType: RegisterAccountTypeId) => void;
};

export function RegisterAccountTypeGrid({ selected, onSelect }: RegisterAccountTypeGridProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-900">{REGISTER_TYPE_SECTION_TITLE}</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        {REGISTER_TYPE_SECTION_SUBTITLE}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REGISTER_ACCOUNT_TYPE_OPTIONS.map((option) => {
          const Icon = ACCOUNT_ICONS[option.id];
          const active = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              aria-pressed={active}
              className={`relative rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:border-neutral-300 ${
                active
                  ? "border-yunicity-primary ring-2 ring-yunicity-primary/20"
                  : "border-neutral-200/90"
              }`}
            >
              {active ? (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-yunicity-primary text-white">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
              ) : null}
              <span
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${option.iconToneClassName}`}
              >
                <Icon className="h-7 w-7" aria-hidden />
              </span>
              <h3 className="mt-4 text-center text-base font-bold text-neutral-900">
                {option.title}
              </h3>
              <p className="mt-2 text-center text-sm leading-relaxed text-neutral-600">
                {option.description}
              </p>
              <span
                className={`mx-auto mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${option.badgeClassName}`}
              >
                {option.badge}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl bg-[#EEF0FF] p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-yunicity-primary">
            <Building2 className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-neutral-900">{REGISTER_TYPE_INFO_TITLE}</p>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">{REGISTER_TYPE_INFO_BODY}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
