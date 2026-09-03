"use client";

import { PublicHomeMediumCategoryPill } from "@/components/marketing/medium/public-home-medium-category-pill";
import {
  PUBLIC_HOME_COPY,
  PUBLIC_HOME_FEATURES,
  PUBLIC_HOME_HERO_IMAGES,
  PUBLIC_HOME_ROUTES,
} from "@/lib/marketing/public-home-contract";
import { Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const controlClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2";

function HeroImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-neutral-100 ${className ?? ""}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(min-width:640px) 45vw"
        priority={priority}
      />
    </div>
  );
}

export function PublicHomeMediumHero() {
  const [neighborhoods, tribes, places] = PUBLIC_HOME_FEATURES;

  return (
    <section className="grid items-center gap-8 md:grid-cols-2 md:gap-10">
      <div className="max-w-lg">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-yunicity-primary">
          {PUBLIC_HOME_COPY.heroEyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-[1.08] tracking-tight text-neutral-950 md:text-[2.65rem]">
          {PUBLIC_HOME_COPY.heroTitle}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-neutral-600 md:text-lg">
          {PUBLIC_HOME_COPY.heroBody}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={PUBLIC_HOME_ROUTES.discover}
            data-public-home-control="hero-discover"
            className={`${controlClass} bg-yunicity-primary text-white hover:bg-yunicity-primary-hover`}
          >
            {PUBLIC_HOME_COPY.heroDiscover}
          </Link>
          <Link
            href={PUBLIC_HOME_ROUTES.register}
            data-public-home-control="hero-register"
            className={`${controlClass} border border-neutral-300 bg-white text-yunicity-primary hover:bg-neutral-50`}
          >
            {PUBLIC_HOME_COPY.heroRegister}
          </Link>
        </div>
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-neutral-500">
          <Lock className="h-4 w-4 shrink-0" aria-hidden />
          {PUBLIC_HOME_COPY.heroGuestNote}
        </p>
      </div>

      <div className="relative min-w-0">
        <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-2.5">
          <HeroImage
            src={PUBLIC_HOME_HERO_IMAGES.cathedral}
            alt="Cathédrale de Reims"
            className="min-h-[340px]"
            priority
          />
          <div className="flex flex-col gap-2.5">
            <HeroImage
              src={PUBLIC_HOME_HERO_IMAGES.street}
              alt="Rue piétonne à Reims"
              className="aspect-[4/3] min-h-[100px]"
            />
            <HeroImage
              src={PUBLIC_HOME_HERO_IMAGES.community}
              alt="Rencontres locales à Reims"
              className="aspect-[4/3] min-h-[100px]"
            />
            <HeroImage
              src={PUBLIC_HOME_HERO_IMAGES.street}
              alt="Commerces locaux à Reims"
              className="aspect-[4/3] min-h-[100px]"
            />
          </div>
        </div>

        {neighborhoods ? (
          <PublicHomeMediumCategoryPill
            feature={neighborhoods}
            className="absolute left-[38%] top-[8%] z-10 -translate-x-1/2"
          />
        ) : null}
        {tribes ? (
          <PublicHomeMediumCategoryPill
            feature={tribes}
            className="absolute right-[4%] top-[42%] z-10"
          />
        ) : null}
        {places ? (
          <PublicHomeMediumCategoryPill
            feature={places}
            className="absolute bottom-[6%] right-[8%] z-10"
          />
        ) : null}
      </div>
    </section>
  );
}
