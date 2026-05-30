"use client";

import type { RegisterDraft } from "@yunicity/utils";
import {
  REGISTER_TERMS_LABEL,
  REGISTER_VERIFY_PASSWORD_TITLE,
  REGISTER_VERIFY_RULE_DIGIT,
  REGISTER_VERIFY_RULE_LENGTH,
  REGISTER_VERIFY_RULE_LOWER,
  REGISTER_VERIFY_RULE_UPPER,
  REGISTER_VERIFY_SECTION_SUBTITLE,
  REGISTER_VERIFY_SECTION_TITLE,
  evaluateRegisterPasswordRules,
} from "@yunicity/utils";
import { Check, ShieldCheck } from "lucide-react";

type RegisterVerificationStepProps = {
  draft: RegisterDraft;
  onChange: (patch: Partial<RegisterDraft>) => void;
};

const RULES = [
  { id: "length" as const, label: REGISTER_VERIFY_RULE_LENGTH },
  { id: "upper" as const, label: REGISTER_VERIFY_RULE_UPPER },
  { id: "lower" as const, label: REGISTER_VERIFY_RULE_LOWER },
  { id: "digit" as const, label: REGISTER_VERIFY_RULE_DIGIT },
];

export function RegisterVerificationStep({ draft, onChange }: RegisterVerificationStepProps) {
  const passwordRules = evaluateRegisterPasswordRules(draft.password);

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-900">{REGISTER_VERIFY_SECTION_TITLE}</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        {REGISTER_VERIFY_SECTION_SUBTITLE}
      </p>

      <section className="mt-6 rounded-2xl border border-neutral-200/90 bg-neutral-50/80 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 shrink-0 text-yunicity-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-neutral-900">{REGISTER_VERIFY_PASSWORD_TITLE}</h3>
            <ul className="mt-3 space-y-2">
              {RULES.map((rule) => {
                const ok = passwordRules[rule.id];
                return (
                  <li key={rule.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        ok ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-500"
                      }`}
                    >
                      <Check className="h-3 w-3" aria-hidden />
                    </span>
                    <span className={ok ? "text-neutral-800" : "text-neutral-500"}>{rule.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200/90 bg-white p-4">
        <input
          type="checkbox"
          checked={draft.acceptedTerms}
          onChange={(event) => onChange({ acceptedTerms: event.target.checked })}
          className="mt-1 h-4 w-4 rounded border-neutral-300 text-yunicity-primary focus:ring-yunicity-primary"
        />
        <span className="text-sm leading-relaxed text-neutral-700">{REGISTER_TERMS_LABEL}</span>
      </label>
    </div>
  );
}
