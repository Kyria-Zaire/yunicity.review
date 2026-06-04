"use client";

import { PassportOffersWorkspace } from "@/components/passport-offers/passport-offers-workspace";
import { Suspense } from "react";

export default function PassportOffersPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-stone-500">Chargement du workspace Passport Offers…</p>}
    >
      <PassportOffersWorkspace />
    </Suspense>
  );
}
