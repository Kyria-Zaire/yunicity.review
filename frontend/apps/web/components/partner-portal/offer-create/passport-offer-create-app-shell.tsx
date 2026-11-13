"use client";

import type { ReactNode } from "react";

type PassportOfferCreateAppShellProps = {
  children: ReactNode;
  variant?: "default" | "mobile";
  /**
   * Classe de palier (`web-*-passport-offer-create-only`) : rattache l'enveloppe ENTIÈRE
   * — fond et hauteur compris — aux formats où elle s'affiche. Absente pour les états
   * communs à tous les formats (chargement, droits insuffisants).
   */
  formatClassName?: string;
};

/** Shell création offre Passport (WEB-PASSPORT-OFFER-CREATE-01). */
export function PassportOfferCreateAppShell({
  children,
  variant = "default",
  formatClassName,
}: PassportOfferCreateAppShellProps) {
  const format = formatClassName ? ` ${formatClassName}` : "";

  if (variant === "mobile") {
    return (
      <div
        className={`passport-offer-create-shell passport-offer-create-mobile-shell min-h-dvh bg-[#F4F5F7]${format}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={`passport-offer-create-shell min-h-dvh bg-[#F4F5F7]${format}`}>
      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 lg:px-6 lg:py-6">{children}</div>
    </div>
  );
}
