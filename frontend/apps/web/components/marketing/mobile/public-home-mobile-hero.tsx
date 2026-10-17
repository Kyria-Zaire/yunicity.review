"use client";

import {
  PUBLIC_HOME_COPY,
  PUBLIC_HOME_HERO_IMAGES,
  PUBLIC_HOME_ROUTES,
} from "@/lib/marketing/public-home-contract";
import Image from "next/image";
import Link from "next/link";

export function PublicHomeMobileHero() {
  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-yunicity-primary">
          {PUBLIC_HOME_COPY.heroEyebrow}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-950">
          {PUBLIC_HOME_COPY.heroTitle}
        </h1>
        <p className="text-base leading-relaxed text-neutral-600">
          {PUBLIC_HOME_COPY.heroBody}
        </p>
      </div>

      <div className="flex w-full flex-col items-stretch gap-3">
        <Link
          href={PUBLIC_HOME_ROUTES.discover}
          data-public-home-control="hero-discover"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
        >
          {PUBLIC_HOME_COPY.heroDiscover}
        </Link>
        <Link
          href={PUBLIC_HOME_ROUTES.register}
          data-public-home-control="hero-register"
          className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-yunicity-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
        >
          {PUBLIC_HOME_COPY.heroRegister}
        </Link>
      </div>

      <p className="text-sm text-neutral-500">{PUBLIC_HOME_COPY.heroGuestNote}</p>

      <div className="relative mt-2 aspect-[4/3] w-full overflow-hidden rounded-3xl bg-neutral-100">
        <Image
          src={PUBLIC_HOME_HERO_IMAGES.cathedral}
          alt="Cathédrale de Reims"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}
