"use client";

import { yunicityBtnPrimary } from "@/lib/brand-classes";
import { PASSPORT_SESSION_EXPIRED_MESSAGE, buildLoginUrlWithNext } from "@yunicity/utils";
import { useRouter } from "next/navigation";

export function PassportSessionExpiredState() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-amber-200/90 bg-white p-8 text-center shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Passport</p>
      <h2 className="mt-2 text-xl font-bold text-neutral-900">Session expirée</h2>
      <p className="mt-2 text-sm text-neutral-600">{PASSPORT_SESSION_EXPIRED_MESSAGE}</p>
      <button
        type="button"
        onClick={() => router.replace(buildLoginUrlWithNext("/passport"))}
        className={`mt-6 ${yunicityBtnPrimary}`}
      >
        Se reconnecter
      </button>
    </div>
  );
}
