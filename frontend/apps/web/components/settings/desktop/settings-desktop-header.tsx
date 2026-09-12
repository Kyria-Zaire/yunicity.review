"use client";

import {
  SETTINGS_DESKTOP_BREADCRUMB_PROFILE,
  SETTINGS_DESKTOP_BREADCRUMB_SETTINGS,
  SETTINGS_DESKTOP_SUBTITLE,
  SETTINGS_DESKTOP_TITLE,
} from "@yunicity/utils";
import Link from "next/link";

export function SettingsDesktopHeader() {
  return (
    <header className="mb-6" data-settings-desktop-header="">
      <nav aria-label="Fil d'Ariane" className="text-sm text-neutral-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/profile/me" className="hover:text-neutral-800 hover:underline">
              {SETTINGS_DESKTOP_BREADCRUMB_PROFILE}
            </Link>
          </li>
          <li aria-hidden className="text-neutral-400">
            /
          </li>
          <li className="font-medium text-neutral-700">{SETTINGS_DESKTOP_BREADCRUMB_SETTINGS}</li>
        </ol>
      </nav>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-950">{SETTINGS_DESKTOP_TITLE}</h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-neutral-500">
        {SETTINGS_DESKTOP_SUBTITLE}
      </p>
    </header>
  );
}
