"use client";

import { PartnerLeadsList } from "@/components/partners/partner-leads-list";

export default function PartnerLeadsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 py-2">
      <PartnerLeadsList variant="page" />
    </div>
  );
}
