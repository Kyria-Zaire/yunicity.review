"use client";

import { OrganizationRequestAside } from "@/components/layout/web-page-asides";
import { WebAppShell } from "@/components/layout";
import { OrganizationRequestForm } from "@/components/organization-request-form";
import { ProtectedRoute } from "@/components/protected-route";

export default function OrganizationRequestPage() {
  return (
    <ProtectedRoute>
      <WebAppShell
        header={{
          title: "Proposer un lieu",
          subtitle: "Rejoins le réseau des acteurs locaux de Reims.",
        }}
        context={<OrganizationRequestAside />}
        contentWidth="form"
      >
        <OrganizationRequestForm />
      </WebAppShell>
    </ProtectedRoute>
  );
}
