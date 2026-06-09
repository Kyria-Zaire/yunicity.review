"use client";

import { PartnerLeadsList } from "@/components/partners/partner-leads-list";

export function PartnersLeadsTab({ city = "Reims" }: { city?: string }) {
  return <PartnerLeadsList variant="embedded" city={city} />;
}
