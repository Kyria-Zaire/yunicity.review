"use client";

import { YunicityLogo } from "@/components/brand";
import {
  LOGIN_FORGOT_BACK,
  LOGIN_FORGOT_PAGE_BODY,
  LOGIN_FORGOT_PAGE_TITLE,
} from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F4F5F7] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200/90 bg-white p-8 shadow-sm">
        <div className="mb-4 flex justify-center">
          <YunicityLogo size="lg" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">{LOGIN_FORGOT_PAGE_TITLE}</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">{LOGIN_FORGOT_PAGE_BODY}</p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {LOGIN_FORGOT_BACK}
        </Link>
      </div>
    </main>
  );
}
