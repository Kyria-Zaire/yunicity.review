"use client";

import type { PassportDesktopSegmentProgress, PassportLevelView } from "@yunicity/utils";
import {
  PASSPORT_DESKTOP_HERO_HISTORY_CTA,
  PASSPORT_DESKTOP_HERO_KICKER,
  PASSPORT_DESKTOP_HERO_LEVEL_PREFIX,
  PASSPORT_DESKTOP_HERO_NEXT_LEVEL,
  PASSPORT_DESKTOP_HERO_PROGRESS_HINT,
  PASSPORT_DESKTOP_HERO_SCAN_CTA,
  PASSPORT_DESKTOP_HERO_SEGMENT_LABEL,
  formatPassportDesktopLevelName,
} from "@yunicity/utils";
import { PassportBookletMark } from "@/components/passport/passport-booklet-icon";
import { History, QrCode, UserRound } from "lucide-react";
import Link from "next/link";

const HERO_IMAGE_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Reims_Cathedral_-_west_facade_%28by_Pudelek%29.jpg/1280px-Reims_Cathedral_-_west_facade_%28by_Pudelek%29.jpg";

type PassportDesktopHeroCardProps = {
  city: string;
  displayName: string;
  levelView: PassportLevelView;
  segmentProgress: PassportDesktopSegmentProgress;
  onOpenHistory: () => void;
  /**
   * Défilement vers le panneau QR VISIBLE. Le lien garde sa sémantique et son
   * `href` — il reste la cible de repli — mais `#passport-desktop-qr` ne
   * désigne que la variante desktop : sous 1024 px, le panneau visible est
   * celui du bloc medium, et seul le résolveur sait lequel l'est.
   */
  onOpenQr?: () => void;
};

export function PassportDesktopHeroCard({
  city,
  displayName,
  levelView,
  segmentProgress,
  onOpenHistory,
  onOpenQr,
}: PassportDesktopHeroCardProps) {
  const nextLabel = formatPassportDesktopLevelName(
    levelView.nextLevelLabel ?? levelView.nextLevel?.label ?? "",
  );
  const currentLabel = formatPassportDesktopLevelName(levelView.level.label);

  return (
    /*
     * Surface premium canonique — §0 Brand Identity (306F).
     *
     * Ce héros portait `bg-yunicity-primary` (#2A2FFF) ET un `bg-gradient-to-r`.
     * Deux écarts au canon : le jeton de la carte Passport est
     * `--yunicity-premium-surface` (#0B1533, « surface navy pleine, validée
     * DA »), et les gradients sont proscrits. Relevé en navigateur avant
     * correction : AUCUN élément de /passport ne rendait #0B1533 — les deux
     * seuls composants qui l'appliquent (`passport-hero`,
     * `passport-mobile-hero-card`) ne sont montés nulle part.
     *
     * Contraste mesuré sur la surface canonique : blanc 100 % -> 17,96:1,
     * 90 % -> 14,66, 85 % -> 13,08, 80 % -> 11,65, 75 % -> 10,39,
     * 70 % -> 9,16. Tous au-dessus d'AA, et au-dessus des 7,12:1 que donnait
     * #2A2FFF. L'image territoriale passe de 25 % à 15 % : le pire cas
     * théorique (pixel blanc sous le texte le plus faible) tient alors 6,58:1,
     * contre 4,94:1 auparavant.
     */
    <section
      id="passport-desktop-overview"
      className="relative scroll-mt-28 overflow-hidden rounded-[1.35rem] bg-yunicity-premium text-yunicity-premium-fg shadow-[0_18px_40px_rgba(11,21,51,0.28)]"
      data-passport-desktop-hero=""
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[46%] bg-cover bg-center opacity-15"
        style={{ backgroundImage: `url(${HERO_IMAGE_URL})` }}
        aria-hidden
      />

      <div className="relative grid grid-cols-[5.25rem_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-6 sm:p-6 md:grid-cols-[9.75rem_minmax(0,1fr)_minmax(12.5rem,15.5rem)] md:items-stretch">
        <div>
          <div className="md:hidden">
            <PassportBookletMark compact />
          </div>
          <div className="hidden md:block">
            <PassportBookletMark />
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
            {PASSPORT_DESKTOP_HERO_KICKER(city)}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{displayName}</h2>
          <p className="mt-1 text-sm text-white/85">
            {PASSPORT_DESKTOP_HERO_LEVEL_PREFIX} · {currentLabel}
          </p>

          <div className="mt-5 max-w-md">
            <div className="flex gap-1.5" aria-hidden>
              {Array.from({ length: segmentProgress.total }).map((_, index) => (
                <span
                  key={index}
                  className={`h-2.5 flex-1 rounded-full ${index < segmentProgress.completed ? "bg-white" : "bg-white/30"}`}
                />
              ))}
            </div>
            <p className="mt-2 text-xs font-medium text-white/90">
              {PASSPORT_DESKTOP_HERO_SEGMENT_LABEL(segmentProgress.completed, segmentProgress.total)}
            </p>
            <p className="mt-1 text-[11px] text-white/70">{PASSPORT_DESKTOP_HERO_PROGRESS_HINT}</p>
          </div>
        </div>

        <div className="col-span-2 flex flex-col justify-end gap-4 md:col-span-1">
          {nextLabel ? (
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <UserRound className="h-4 w-4 shrink-0 text-white/85" aria-hidden />
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-wide text-white/70">
                  {PASSPORT_DESKTOP_HERO_NEXT_LEVEL}
                </span>
                {nextLabel}
              </span>
            </p>
          ) : null}

          <div className="flex flex-row gap-2.5">
            <Link
              href="#passport-desktop-qr"
              onClick={
                onOpenQr
                  ? (event) => {
                      event.preventDefault();
                      onOpenQr();
                    }
                  : undefined
              }
              className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-center text-sm font-semibold text-yunicity-primary transition hover:bg-white/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <QrCode className="h-4 w-4 shrink-0" aria-hidden />
              {PASSPORT_DESKTOP_HERO_SCAN_CTA}
            </Link>
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-white/80 bg-transparent px-3 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <History className="h-4 w-4 shrink-0" aria-hidden />
              {PASSPORT_DESKTOP_HERO_HISTORY_CTA}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
