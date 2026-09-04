"use client";

import { YunicityLogo } from "@/components/brand";
import { PUBLIC_HOME_COPY, PUBLIC_HOME_ROUTES } from "@/lib/marketing/public-home-contract";
import Link from "next/link";

const desktopControlClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2";

export function PublicHomeHeader() {
  return (
    <header className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3 lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-8">
        <YunicityLogo
          size="sm"
          showWordmark
          href={PUBLIC_HOME_ROUTES.home}
          priority
          wordmarkClassName="text-neutral-950"
        />

        <nav
          aria-label="Navigation principale"
          className="hidden items-center justify-center gap-8 lg:flex"
        >
          <Link
            href={PUBLIC_HOME_ROUTES.discover}
            data-public-home-control="header-discover"
            className="text-sm font-medium text-neutral-800 transition hover:text-neutral-950"
          >
            {PUBLIC_HOME_COPY.headerDiscover}
          </Link>
          <Link
            href={PUBLIC_HOME_ROUTES.howItWorks}
            data-public-home-control="header-how-it-works"
            className="text-sm font-medium text-neutral-800 transition hover:text-neutral-950"
          >
            {PUBLIC_HOME_COPY.headerHowItWorks}
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2 lg:justify-self-end">
          <Link
            href={PUBLIC_HOME_ROUTES.login}
            data-public-home-control="header-login"
            className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-neutral-900 hover:text-neutral-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 sm:px-3 lg:rounded-full lg:border lg:border-neutral-300 lg:bg-white lg:font-semibold lg:hover:bg-neutral-50"
          >
            {PUBLIC_HOME_COPY.headerLogin}
          </Link>
          <Link
            href={PUBLIC_HOME_ROUTES.register}
            data-public-home-control="header-register"
            className={`${desktopControlClass} border border-yunicity-primary bg-white text-yunicity-primary hover:bg-yunicity-primary/5 lg:border-transparent lg:bg-yunicity-primary lg:text-white lg:hover:bg-yunicity-primary-hover`}
          >
            {PUBLIC_HOME_COPY.headerRegister}
          </Link>
        </div>
      </div>
    </header>
  );
}
