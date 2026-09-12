"use client";

import { PassportOfferCreateAppShell } from "@/components/partner-portal/offer-create/passport-offer-create-app-shell";
import { PassportOfferCreateDesktopScreen } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-screen";
import { PassportOfferCreateMediumScreen } from "@/components/partner-portal/offer-create/medium/passport-offer-create-medium-screen";
import { PassportOfferCreateMobileScreen } from "@/components/partner-portal/offer-create/mobile/passport-offer-create-mobile-screen";
import type { usePassportOfferCreateContext } from "@/hooks/use-passport-offer-create-context";
import { PASSPORT_OFFER_CREATE_LOADING, buildPartnerPortalOffersHref } from "@yunicity/utils";
import Link from "next/link";

type PassportOfferCreateContextValue = ReturnType<typeof usePassportOfferCreateContext>;

type PassportOfferCreateScreenProps = {
  ctx: PassportOfferCreateContextValue;
};

export function PassportOfferCreateScreen({ ctx }: PassportOfferCreateScreenProps) {
  if (ctx.loading) {
    return (
      <PassportOfferCreateAppShell>
        <p className="py-16 text-center text-sm text-neutral-500" role="status">
          {PASSPORT_OFFER_CREATE_LOADING}
        </p>
      </PassportOfferCreateAppShell>
    );
  }

  if (!ctx.ctx.canManage || !ctx.ctx.organization) {
    return (
      <PassportOfferCreateAppShell>
        <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-10 text-center">
          <p className="text-sm text-neutral-600">
            Vous n&apos;avez pas les droits pour créer une offre sur ce lieu.
          </p>
          <Link
            href={buildPartnerPortalOffersHref()}
            className="mt-4 inline-block text-sm font-semibold text-yunicity-primary hover:underline"
          >
            Retour à mes offres
          </Link>
        </div>
      </PassportOfferCreateAppShell>
    );
  }

  return (
    <>
      <PassportOfferCreateAppShell variant="mobile">
        <div className="web-mobile-passport-offer-create-only">
          <PassportOfferCreateMobileScreen ctx={ctx} />
        </div>
      </PassportOfferCreateAppShell>

      <PassportOfferCreateAppShell>
        <div className="web-medium-passport-offer-create-only">
          <PassportOfferCreateMediumScreen ctx={ctx} />
        </div>
        <div className="web-desktop-passport-offer-create-only">
          <PassportOfferCreateDesktopScreen ctx={ctx} />
        </div>
      </PassportOfferCreateAppShell>
    </>
  );
}
