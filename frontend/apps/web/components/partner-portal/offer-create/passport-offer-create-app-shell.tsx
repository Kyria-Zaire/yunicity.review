"use client";

import type { ReactNode } from "react";

type PassportOfferCreateAppShellProps = {
  children: ReactNode;
  variant?: "default" | "mobile";
};

/** Shell création offre Passport (WEB-PASSPORT-OFFER-CREATE-01). */
export function PassportOfferCreateAppShell({
  children,
  variant = "default",
}: PassportOfferCreateAppShellProps) {
  if (variant === "mobile") {
    return (
      <div className="passport-offer-create-shell passport-offer-create-mobile-shell min-h-dvh bg-[#F4F5F7]">
        {children}
      </div>
    );
  }

  return (
    <div className="passport-offer-create-shell min-h-dvh bg-[#F4F5F7]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 lg:px-6 lg:py-6">{children}</div>
    </div>
  );
}
