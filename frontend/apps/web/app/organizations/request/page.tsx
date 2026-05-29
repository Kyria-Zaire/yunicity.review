import { OrganizationRequestScreen } from "@/components/organizations/organization-request-screen";
import { ProtectedRoute } from "@/components/protected-route";
import { ORG_REQUEST_LOADING } from "@yunicity/utils";
import { Suspense } from "react";

export default function OrganizationRequestPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<p className="px-4 py-6 text-sm text-neutral-500">{ORG_REQUEST_LOADING}</p>}>
        <OrganizationRequestScreen />
      </Suspense>
    </ProtectedRoute>
  );
}
