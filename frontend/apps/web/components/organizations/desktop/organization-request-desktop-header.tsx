"use client";

import {
  ORG_REQUEST_BACK_PLACES,
  ORG_REQUEST_DRAFT_SAVED,
  ORG_REQUEST_PORTAL_SUBTITLE,
  ORG_REQUEST_PORTAL_TITLE,
  ORG_REQUEST_SAVE_EXIT,
} from "@yunicity/utils";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type OrganizationRequestDesktopHeaderProps = {
  hasDraftContent: boolean;
  onSaveExit: () => void;
};

export function OrganizationRequestDesktopHeader({
  hasDraftContent,
  onSaveExit,
}: OrganizationRequestDesktopHeaderProps) {
  return (
    <header className="mb-5" data-org-request-desktop-header="">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <Link
          href="/places"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-700 transition hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {ORG_REQUEST_BACK_PLACES}
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {hasDraftContent ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {ORG_REQUEST_DRAFT_SAVED}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onSaveExit}
            className="rounded-xl border border-yunicity-primary bg-white px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
          >
            {ORG_REQUEST_SAVE_EXIT}
          </button>
        </div>
      </div>

      <div className="mt-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.75rem]">
          {ORG_REQUEST_PORTAL_TITLE}
        </h1>
        <p className="mx-auto mt-1.5 max-w-2xl text-sm text-neutral-600">
          {ORG_REQUEST_PORTAL_SUBTITLE}
        </p>
      </div>
    </header>
  );
}
