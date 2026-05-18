"use client";

import { AppShell } from "@/components/app-shell";
import { OrganizationRequestForm } from "@/components/organization-request-form";
import { ProtectedRoute } from "@/components/protected-route";

export default function OrganizationRequestPage() {
  return (
    <ProtectedRoute>
      <AppShell
        title="Proposer un lieu"
        subtitle="Rejoins le réseau des acteurs locaux de Reims."
      >
        <OrganizationRequestForm />
      </AppShell>
    </ProtectedRoute>
  );
}
