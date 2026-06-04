"use client";

import { PassportDetailView } from "@/components/passport-ops/detail/passport-detail-view";
import { useParams } from "next/navigation";

export default function PassportOpsDetailPage() {
  const params = useParams<{ id: string }>();
  const passportId = params.id ?? "";

  return <PassportDetailView passportId={passportId} />;
}
