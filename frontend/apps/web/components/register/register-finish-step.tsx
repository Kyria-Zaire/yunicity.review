"use client";

import type { RegisterDraft } from "@yunicity/utils";
import {
  REGISTER_FINISH_ACCOUNT_TYPE,
  REGISTER_FINISH_CITY,
  REGISTER_FINISH_EMAIL,
  REGISTER_FINISH_FULL_NAME,
  REGISTER_FINISH_SECTION_SUBTITLE,
  REGISTER_FINISH_SECTION_TITLE,
  resolveRegisterAccountType,
} from "@yunicity/utils";

type RegisterFinishStepProps = {
  draft: RegisterDraft;
};

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-100 py-3 last:border-0 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-xs font-bold uppercase tracking-wide text-neutral-400">
        {label}
      </dt>
      <dd className="text-sm font-medium text-neutral-900">{value}</dd>
    </div>
  );
}

export function RegisterFinishStep({ draft }: RegisterFinishStepProps) {
  const accountType = resolveRegisterAccountType(draft.accountType);

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-900">{REGISTER_FINISH_SECTION_TITLE}</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        {REGISTER_FINISH_SECTION_SUBTITLE}
      </p>

      <dl className="mt-6 rounded-2xl border border-neutral-200/90 bg-neutral-50/50 p-5">
        <ReviewRow
          label={REGISTER_FINISH_ACCOUNT_TYPE}
          value={accountType?.title ?? "—"}
        />
        <ReviewRow label={REGISTER_FINISH_FULL_NAME} value={draft.fullName.trim() || "—"} />
        <ReviewRow label={REGISTER_FINISH_EMAIL} value={draft.email.trim() || "—"} />
        <ReviewRow label={REGISTER_FINISH_CITY} value={draft.city.trim() || "—"} />
      </dl>
    </div>
  );
}
