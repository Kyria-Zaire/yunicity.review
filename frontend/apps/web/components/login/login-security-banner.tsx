"use client";

import {
  LOGIN_SECURITY_BODY,
  LOGIN_SECURITY_CTA,
  LOGIN_SECURITY_TITLE,
} from "@yunicity/utils";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function LoginSecurityBanner() {
  return (
    <section className="mt-6 rounded-2xl border border-sky-100 bg-sky-50/80 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 shrink-0 text-yunicity-primary" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-neutral-900">{LOGIN_SECURITY_TITLE}</p>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">{LOGIN_SECURITY_BODY}</p>
          </div>
        </div>
        <Link
          href="/settings"
          className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {LOGIN_SECURITY_CTA}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
