"use client";

import { PublicHomeDesktopFeatureMiniCard } from "@/components/marketing/desktop/public-home-desktop-feature-mini-card";
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
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-6 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2";

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
        sizes="(min-width:1024px) 28vw"
        priority={priority}
      />
    </div>
  );
}

export function PublicHomeDesktopHero() {
  return (
    <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14 xl:gap-16">
      <div className="max-w-xl pt-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-yunicity-primary">
          {PUBLIC_HOME_COPY.heroEyebrow}
        </p>
        <h1 className="mt-4 text-[2.75rem] font-bold leading-[1.08] tracking-tight text-neutral-950 xl:text-[3.5rem]">
          {PUBLIC_HOME_COPY.heroTitle}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-neutral-600">{PUBLIC_HOME_COPY.heroBody}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
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
        <p className="mt-5 inline-flex items-center gap-2 text-sm text-neutral-500">
          <Lock className="h-4 w-4 shrink-0" aria-hidden />
          {PUBLIC_HOME_COPY.heroGuestNote}
        </p>
      </div>

      <div className="relative min-w-0 pb-16 xl:pb-20">
        <div className="grid grid-cols-[minmax(0,0.46fr)_minmax(0,0.54fr)] gap-3">
          <div className="flex flex-col gap-3">
            <HeroImage
              src={PUBLIC_HOME_HERO_IMAGES.cathedral}
              alt="Cathédrale de Reims"
              className="aspect-[3/4] min-h-[240px]"
              priority
            />
            <HeroImage
              src={PUBLIC_HOME_HERO_IMAGES.community}
              alt="Rencontres locales à Reims"
              className="aspect-[4/3] min-h-[140px]"
            />
          </div>
          <HeroImage
            src={PUBLIC_HOME_HERO_IMAGES.street}
            alt="Rue piétonne à Reims"
            className="min-h-[420px]"
            priority
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-3">
          {PUBLIC_HOME_FEATURES.map((feature) => (
            <PublicHomeDesktopFeatureMiniCard key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
