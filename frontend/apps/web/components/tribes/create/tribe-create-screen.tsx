"use client";

import { TribeCreatePreview } from "@/components/tribes/create/tribe-create-preview";
import { TribeCreateSidebar } from "@/components/tribes/create/tribe-create-sidebar";
import { TribeCreateStepper } from "@/components/tribes/create/tribe-create-stepper";
import { TribeCreateWizard } from "@/components/tribes/create/tribe-create-wizard";
import { TribesAppShell } from "@/components/tribes/tribes-app-shell";
import { useTribeCreateContext } from "@/hooks/use-tribe-create-context";
import {
  TRIBE_CREATE_ERROR,
  TRIBE_CREATE_LOADING,
  TRIBE_CREATE_SUBTITLE,
  TRIBE_CREATE_SUCCESS_BODY,
  TRIBE_CREATE_SUCCESS_CTA,
  TRIBE_CREATE_SUCCESS_TITLE,
  TRIBE_CREATE_TITLE,
  tribeHref,
} from "@yunicity/utils";
import Link from "next/link";

export function TribeCreateScreen() {
  const ctx = useTribeCreateContext();

  if (ctx.loading) {
    return (
      <TribesAppShell>
        <p className="px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {TRIBE_CREATE_LOADING}
        </p>
      </TribesAppShell>
    );
  }

  if (ctx.createdTribe) {
    const city = ctx.createdTribe.city.trim() || ctx.draft.city.trim() || "Reims";
    return (
      <TribesAppShell>
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
      </TribesAppShell>
    );
  }

  return (
    <TribesAppShell>
      <div className="mx-auto w-full max-w-[1400px] px-3 py-2 sm:px-4 lg:px-6">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            <header className="mb-2">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{TRIBE_CREATE_TITLE}</h1>
              <p className="mt-2 text-sm text-neutral-600">{TRIBE_CREATE_SUBTITLE}</p>
            </header>

            <TribeCreateStepper activeStep={ctx.step} />

            {ctx.error ? (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {TRIBE_CREATE_ERROR}
              </p>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
              <TribeCreateWizard
                step={ctx.step}
                draft={ctx.draft}
                validationMessage={ctx.validationMessage}
                isSubmitting={ctx.isSubmitting}
                onChange={ctx.updateDraft}
                onBack={ctx.goBack}
                onNext={ctx.goNext}
                onSubmit={() => void ctx.submit()}
              />
              <TribeCreatePreview draft={ctx.draft} />
            </div>
          </div>

          <TribeCreateSidebar exampleTribes={ctx.exampleTribes} city={ctx.draft.city} />
        </div>
      </div>
    </TribesAppShell>
  );
}
