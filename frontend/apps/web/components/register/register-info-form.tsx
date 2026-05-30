"use client";

import type { RegisterDraft } from "@yunicity/utils";
import {
  REGISTER_FIELD_CITY,
  REGISTER_FIELD_CONFIRM_PASSWORD,
  REGISTER_FIELD_EMAIL,
  REGISTER_FIELD_FULL_NAME,
  REGISTER_FIELD_PASSWORD,
  REGISTER_INFO_SECTION_SUBTITLE,
  REGISTER_INFO_SECTION_TITLE,
  REGISTER_PASSWORD_HINT,
} from "@yunicity/utils";

type RegisterInfoFormProps = {
  draft: RegisterDraft;
  onChange: (patch: Partial<RegisterDraft>) => void;
};

export function RegisterInfoForm({ draft, onChange }: RegisterInfoFormProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-900">{REGISTER_INFO_SECTION_TITLE}</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        {REGISTER_INFO_SECTION_SUBTITLE}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-neutral-800">{REGISTER_FIELD_FULL_NAME}</span>
          <input
            required
            minLength={2}
            autoComplete="name"
            value={draft.fullName}
            onChange={(event) => onChange({ fullName: event.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/20"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-neutral-800">{REGISTER_FIELD_EMAIL}</span>
          <input
            required
            type="email"
            autoComplete="email"
            value={draft.email}
            onChange={(event) => onChange({ email: event.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/20"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-neutral-800">{REGISTER_FIELD_PASSWORD}</span>
          <input
            required
            type="password"
            autoComplete="new-password"
            minLength={12}
            value={draft.password}
            onChange={(event) => onChange({ password: event.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/20"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-neutral-800">{REGISTER_FIELD_CONFIRM_PASSWORD}</span>
          <input
            required
            type="password"
            autoComplete="new-password"
            minLength={12}
            value={draft.confirmPassword}
            onChange={(event) => onChange({ confirmPassword: event.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/20"
          />
        </label>

        <p className="text-xs text-neutral-500 sm:col-span-2">{REGISTER_PASSWORD_HINT}</p>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-neutral-800">{REGISTER_FIELD_CITY}</span>
          <input
            required
            minLength={2}
            autoComplete="address-level2"
            value={draft.city}
            onChange={(event) => onChange({ city: event.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/20"
          />
        </label>
      </div>
    </div>
  );
}
