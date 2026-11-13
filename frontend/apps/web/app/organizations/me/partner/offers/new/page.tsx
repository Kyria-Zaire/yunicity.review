"use client";

import { PassportOfferCreateScreen } from "@/components/partner-portal/offer-create/passport-offer-create-screen";
import { usePassportOfferCreateContext } from "@/hooks/use-passport-offer-create-context";

export default function PartnerPortalOfferCreatePage() {
  const ctx = usePassportOfferCreateContext();
  return <PassportOfferCreateScreen ctx={ctx} />;
}
