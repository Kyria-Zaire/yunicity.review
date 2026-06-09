"use client";

import { PartnerLeadsCommandPage } from "@/components/partners/leads/partner-leads-command-page";

export function PartnersLeadsTab({ city = "Reims" }: { city?: string }) {
  return <PartnerLeadsCommandPage variant="embedded" city={city} />;
}
