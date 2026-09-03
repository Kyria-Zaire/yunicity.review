"use client";

import { TribeCreateAppShell } from "@/components/tribes/create/tribe-create-app-shell";
import { TribeCreateDesktopScreen } from "@/components/tribes/create/desktop";
import { TribeCreateMediumScreen } from "@/components/tribes/create/medium";
import { TribeCreateMobileScreen } from "@/components/tribes/create/mobile";
import { useTribeCreateContext } from "@/hooks/use-tribe-create-context";
import {
  TRIBE_CREATE_ERROR,
  TRIBE_CREATE_LOADING,
  TRIBE_CREATE_SUCCESS_BODY,
  TRIBE_CREATE_SUCCESS_CTA,
  TRIBE_CREATE_SUCCESS_TITLE,
  tribeHref,
} from "@yunicity/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function TribeCreateScreen() {
  const searchParams = useSearchParams();
  const ctx = useTribeCreateContext({
    category: searchParams.get("category"),
    city: searchParams.get("city"),
  });

  if (ctx.loading) {
    return (
      <TribeCreateAppShell>
        <p className="px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {TRIBE_CREATE_LOADING}
        </p>
      </TribeCreateAppShell>
    );
  }

  if (ctx.createdTribe) {
    const city = ctx.createdTribe.city.trim() || ctx.draft.city.trim() || "Reims";
    return (
      <TribeCreateAppShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-8 shadow-sm">
            <p className="text-xl font-bold text-emerald-900">{TRIBE_CREATE_SUCCESS_TITLE}</p>
            <p className="mt-3 text-sm text-emerald-800">{TRIBE_CREATE_SUCCESS_BODY}</p>
            <Link
              href={tribeHref(ctx.createdTribe.slug, city)}
              className="mt-6 inline-flex rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
            >
              {TRIBE_CREATE_SUCCESS_CTA}
            </Link>
          </div>
        </div>
      </TribeCreateAppShell>
    );
  }

  return (
    <TribeCreateAppShell>
      <TribeCreateMobileScreen ctx={ctx} />
      <div className="web-medium-tribe-create-only">
        <TribeCreateMediumScreen ctx={ctx} />
      </div>
      <div className="web-desktop-tribe-create-only px-3 py-2 sm:px-4 lg:px-6">
        <TribeCreateDesktopScreen ctx={ctx} />
      </div>
    </TribeCreateAppShell>
  );
}
