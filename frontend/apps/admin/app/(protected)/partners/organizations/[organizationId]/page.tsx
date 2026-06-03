"use client";

import { PartnerDetailView } from "@/components/partners/detail/partner-detail-view";
import { useParams } from "next/navigation";

export default function PartnerOrganizationDetailPage() {
  const params = useParams<{ organizationId: string }>();
  const organizationId = params.organizationId ?? "";

  return <PartnerDetailView organizationId={organizationId} />;
}
