"use client";

import { AuthPortalHeroOverlay } from "@/components/auth/auth-portal-hero-overlay";
import { YunicityLogo } from "@/components/brand";
import {
  REGISTER_DESKTOP_COPY,
  REGISTER_DESKTOP_HERO_IMAGE,
} from "@/lib/auth/register-desktop-contract";
import { Award, MapPin, ShieldCheck, Users } from "lucide-react";
import Image from "next/image";

const FEATURES = [
  { icon: MapPin, label: REGISTER_DESKTOP_COPY.heroDiscover },
  { icon: Users, label: REGISTER_DESKTOP_COPY.heroCommunities },
  { icon: Award, label: REGISTER_DESKTOP_COPY.heroPassport },
] as const;

export function RegisterDesktopHeroPanel() {
  return (
    <aside
      className="relative hidden min-h-dvh overflow-hidden lg:flex lg:flex-col"
      aria-label="Présentation Yunicity"
    >
      <Image
        src={REGISTER_DESKTOP_HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="42vw"
        className="object-cover object-[38%_center] brightness-[0.92]"
      />
      <AuthPortalHeroOverlay variant="desktop" />

      <div className="relative z-10 flex min-h-dvh flex-col px-10 py-10 xl:px-12 xl:py-12">
        <YunicityLogo size="sm" showWordmark href="/" priority wordmarkClassName="text-white" />

        <div className="mt-auto max-w-md pb-8">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-[2.75rem]">
            {REGISTER_DESKTOP_COPY.heroTitle}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/90">
            {REGISTER_DESKTOP_COPY.heroSubtitle}
          </p>

          <ul className="mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm font-medium text-white">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                {label}
              </li>
            ))}
          </ul>

          <p className="mt-10 inline-flex items-center gap-2 text-xs text-white/80">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
            {REGISTER_DESKTOP_COPY.heroPrivacy}
          </p>
        </div>
      </div>
    </aside>
  );
}
