"use client";

import { LOGIN_HELP_BODY, LOGIN_HELP_CTA, LOGIN_HELP_TITLE } from "@yunicity/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function LoginHelpCard() {
  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm lg:max-w-xs">
      <h2 className="text-sm font-bold text-neutral-900">{LOGIN_HELP_TITLE}</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{LOGIN_HELP_BODY}</p>
      <Link
        href="/settings"
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-yunicity-primary transition hover:bg-neutral-50"
      >
        {LOGIN_HELP_CTA}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}
