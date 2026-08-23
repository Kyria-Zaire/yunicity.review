"use client";

import { YunicityLogo } from "@/components/brand";
import {
  PUBLIC_HOME_COPY,
  PUBLIC_HOME_PREVIEWS,
  PUBLIC_HOME_ROUTES,
} from "@/lib/marketing/public-home-contract";
import { YUNICITY_WORDMARK } from "@yunicity/utils";
import { CalendarDays, Home, MapPin, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type UIEvent } from "react";

/** Brand scene already shipped in-repo — not a city photograph. */
const HERO_SCENE_PATH = "/brand/welcomemascot.png";

const PREVIEW_ICONS: Record<(typeof PUBLIC_HOME_PREVIEWS)[number]["icon"], LucideIcon> = {
  neighborhoods: Home,
  sortir: CalendarDays,
  places: MapPin,
};

const PREVIEW_TONES: Record<(typeof PUBLIC_HOME_PREVIEWS)[number]["icon"], string> = {
  neighborhoods: "bg-yunicity-primary-soft text-yunicity-primary",
  sortir: "bg-orange-50 text-orange-600",
  places: "bg-teal-50 text-teal-700",
};

const controlClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-4 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2";

export function PublicHomeLanding() {
  const [activePreview, setActivePreview] = useState(0);

  function handlePreviewScroll(event: UIEvent<HTMLUListElement>) {
    const scroller = event.currentTarget;
    const firstItem = scroller.querySelector("li");
    if (!(firstItem instanceof HTMLElement)) {
      return;
    }
    const stride = firstItem.getBoundingClientRect().width + 16;
    if (stride <= 0) {
      return;
    }
    const next = Math.round(scroller.scrollLeft / stride);
    setActivePreview(Math.min(PUBLIC_HOME_PREVIEWS.length - 1, Math.max(0, next)));
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white text-neutral-900 [padding-bottom:max(1.5rem,env(safe-area-inset-bottom))] [padding-left:max(1rem,env(safe-area-inset-left))] [padding-right:max(1rem,env(safe-area-inset-right))] [padding-top:max(0.75rem,env(safe-area-inset-top))]">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-2 sm:px-6">
        <YunicityLogo
          size="sm"
          showWordmark
          href={PUBLIC_HOME_ROUTES.home}
          priority
          wordmarkClassName="text-yunicity-primary"
        />
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={PUBLIC_HOME_ROUTES.login}
            data-public-home-control="header-login"
            className={`${controlClass} text-yunicity-primary hover:bg-yunicity-primary-soft`}
          >
            {PUBLIC_HOME_COPY.headerLogin}
          </Link>
          <Link
            href={PUBLIC_HOME_ROUTES.register}
            data-public-home-control="header-register"
            className={`${controlClass} bg-yunicity-primary text-white hover:bg-yunicity-primary-hover`}
          >
            {PUBLIC_HOME_COPY.headerRegister}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-2 pb-12 pt-8 sm:px-6 lg:gap-16 lg:pt-16">
        <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className="max-w-xl text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              {PUBLIC_HOME_COPY.heroTitle}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-neutral-600 sm:text-lg">
              {PUBLIC_HOME_COPY.heroBody}
            </p>
            <div className="mt-8 flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:flex-wrap lg:justify-start">
              <Link
                href={PUBLIC_HOME_ROUTES.discover}
                data-public-home-control="hero-discover"
                className={`${controlClass} w-full bg-yunicity-primary text-white hover:bg-yunicity-primary-hover sm:w-auto`}
              >
                {PUBLIC_HOME_COPY.heroDiscover}
              </Link>
              <Link
                href={PUBLIC_HOME_ROUTES.register}
                data-public-home-control="hero-register"
                className={`${controlClass} w-full border border-yunicity-primary text-yunicity-primary hover:bg-yunicity-primary-soft sm:w-auto`}
              >
                {PUBLIC_HOME_COPY.heroRegister}
              </Link>
            </div>
            <Link
              href={PUBLIC_HOME_ROUTES.login}
              data-public-home-control="hero-login"
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-yunicity-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
            >
              {PUBLIC_HOME_COPY.heroExistingAccount}
            </Link>
          </div>

          <div
            aria-hidden="true"
            className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-[2rem] bg-yunicity-primary-soft"
          >
            <Image
              src={HERO_SCENE_PATH}
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 32rem, 90vw"
              className="object-cover"
            />
            <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 sm:bottom-6 sm:left-6">
              <div className="max-w-[16rem] rounded-2xl bg-white px-3 py-2 shadow-md">
                <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                  <MapPin className="h-4 w-4 text-yunicity-primary" />
                  Quartiers
                </p>
              </div>
              <div className="ml-8 max-w-[16rem] rounded-2xl bg-white px-3 py-2 shadow-md sm:ml-16">
                <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  Lieux
                </p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="public-home-previews-title" className="flex flex-col gap-5">
          <h2 id="public-home-previews-title" className="sr-only">
            {PUBLIC_HOME_COPY.previewsEyebrow}
          </h2>
          <ul
            onScroll={handlePreviewScroll}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible md:pb-0"
          >
            {PUBLIC_HOME_PREVIEWS.map((preview) => {
              const Icon = PREVIEW_ICONS[preview.icon];
              return (
                <li
                  key={preview.id}
                  className="w-[min(80vw,20rem)] shrink-0 snap-start md:w-auto"
                >
                  <Link
                    href={preview.href}
                    aria-label={preview.title}
                    data-public-home-control={`preview-${preview.id}`}
                    className="flex h-full min-h-44 flex-col rounded-3xl border border-neutral-200 bg-white p-5 transition hover:border-yunicity-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
                  >
                    <span
                      className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${PREVIEW_TONES[preview.icon]}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="text-lg font-semibold text-neutral-900">{preview.title}</span>
                    <span className="mt-2 text-sm leading-relaxed text-neutral-600">
                      {preview.body}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-center gap-2 md:hidden" aria-hidden="true">
            {PUBLIC_HOME_PREVIEWS.map((preview, index) => (
              <span
                key={preview.id}
                className={`h-2 w-2 rounded-full ${
                  index === activePreview ? "bg-yunicity-primary" : "bg-neutral-300"
                }`}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-2 py-6 text-sm text-neutral-500 sm:flex-row sm:justify-between sm:px-6">
        <p className="font-semibold text-neutral-900">{YUNICITY_WORDMARK}</p>
        <nav aria-label="Liens légaux" className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href={PUBLIC_HOME_ROUTES.privacy}
            data-public-home-control="footer-privacy"
            className={`${controlClass} text-neutral-600 hover:text-neutral-900`}
          >
            {PUBLIC_HOME_COPY.privacy}
          </Link>
          <Link
            href={PUBLIC_HOME_ROUTES.terms}
            data-public-home-control="footer-terms"
            className={`${controlClass} text-neutral-600 hover:text-neutral-900`}
          >
            {PUBLIC_HOME_COPY.terms}
          </Link>
        </nav>
      </footer>
    </div>
  );
}
