"use client";

import { AuthPortalHeroOverlay } from "@/components/auth/auth-portal-hero-overlay";
import {
  REGISTER_DESKTOP_COPY,
  REGISTER_DESKTOP_HERO_IMAGE,
} from "@/lib/auth/register-desktop-contract";
import { ShieldCheck } from "lucide-react";
import Image from "next/image";

export function RegisterPortalCompactHero() {
  return (
    <section className="relative overflow-hidden px-4 py-8 sm:px-6">
      <div className="relative min-h-[11rem] overflow-hidden rounded-2xl px-5 py-8">
        <Image
          src={REGISTER_DESKTOP_HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[38%_center] brightness-[0.92]"
        />
        <AuthPortalHeroOverlay variant="compact" />
        <div className="relative z-10 max-w-md">
          <h2 className="text-2xl font-bold leading-tight text-white">
            {REGISTER_DESKTOP_COPY.heroTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/90">
            {REGISTER_DESKTOP_COPY.compactHeroSubtitle}
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {REGISTER_DESKTOP_COPY.compactHeroPrivacy}
          </p>
        </div>
      </div>
    </section>
  );
}
