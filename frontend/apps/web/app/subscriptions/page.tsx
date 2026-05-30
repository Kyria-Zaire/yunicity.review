import { SubscriptionScreen } from "@/components/subscriptions/subscription-screen";
import { ProtectedRoute } from "@/components/protected-route";
import { SUBSCRIPTION_LOADING } from "@yunicity/utils";
import { Suspense } from "react";

export default function SubscriptionsPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={<p className="px-4 py-6 text-sm text-neutral-500">{SUBSCRIPTION_LOADING}</p>}
      >
        <SubscriptionScreen />
      </Suspense>
    </ProtectedRoute>
  );
}
