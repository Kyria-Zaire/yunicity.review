"use client";

import {
  ORG_REQUEST_AFTER_SUBMIT_1,
  ORG_REQUEST_AFTER_SUBMIT_2,
  ORG_REQUEST_AFTER_SUBMIT_3,
  ORG_REQUEST_AFTER_SUBMIT_BODY,
  ORG_REQUEST_AFTER_SUBMIT_FOOTER,
  ORG_REQUEST_AFTER_SUBMIT_TITLE,
  ORG_REQUEST_PRIVACY,
} from "@yunicity/utils";
import { Flag, MapPin, Search, Shield } from "lucide-react";

const ITEMS = [
  { icon: Search, text: ORG_REQUEST_AFTER_SUBMIT_1 },
  { icon: MapPin, text: ORG_REQUEST_AFTER_SUBMIT_2 },
  { icon: Flag, text: ORG_REQUEST_AFTER_SUBMIT_3 },
] as const;

export function OrganizationRequestMobileAfterSubmit() {
  return (
    <div className="space-y-3" data-org-request-mobile-after-submit="">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{ORG_REQUEST_AFTER_SUBMIT_TITLE}</h2>
        <p className="mt-3 inline-flex items-start gap-2.5 text-sm leading-relaxed text-neutral-600">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
          {ORG_REQUEST_AFTER_SUBMIT_BODY}
        </p>
        <ul className="mt-4 space-y-2.5">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.text} className="flex items-center gap-2.5 text-sm text-neutral-700">
                <Icon className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
                {item.text}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-neutral-500">{ORG_REQUEST_AFTER_SUBMIT_FOOTER}</p>
      </section>

      <section className="rounded-xl border border-[#C7D2FE] bg-[#EEF0FF]/60 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
          <p className="text-xs leading-relaxed text-neutral-700">{ORG_REQUEST_PRIVACY}</p>
        </div>
      </section>
    </div>
  );
}
