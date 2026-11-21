"use client";

import { TRIBE_CREATE_MOBILE_BACK } from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function TribeCreateMobileHeader() {
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]"
      data-tribe-create-mobile-header=""
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => router.push("/tribes")}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition hover:bg-neutral-100"
          aria-label={TRIBE_CREATE_MOBILE_BACK}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
        <span className="inline-flex h-10 w-10 shrink-0" aria-hidden />
      </div>
    </header>
  );
}
