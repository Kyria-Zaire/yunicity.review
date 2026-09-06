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
];

export function OrganizationRequestDesktopAfterSubmit() {
  return (
    <>
      <section
        className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
        data-org-request-desktop-after-submit=""
      >
        <h2 className="text-sm font-bold text-neutral-900">{ORG_REQUEST_AFTER_SUBMIT_TITLE}</h2>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">{ORG_REQUEST_AFTER_SUBMIT_BODY}</p>
        <ul className="mt-4 space-y-3">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.text} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
                {item.text}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-neutral-500">{ORG_REQUEST_AFTER_SUBMIT_FOOTER}</p>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-2.5">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
          <p className="text-xs leading-relaxed text-neutral-600">{ORG_REQUEST_PRIVACY}</p>
        </div>
      </section>
    </>
  );
}
