"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * React Query provider for the admin app (ADMIN-PERF-02A).
 *
 * Defaults tuned for a low-mutation back-office:
 * - staleTime 60s  → returning to a page within a minute serves cache (no refetch).
 * - gcTime 5min    → cache survives navigation away and back.
 * - refetchOnWindowFocus disabled → no surprise refetch when tabbing back.
 * - retry disabled → preserve the previous "show error immediately" behaviour.
 */
export function AdminQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
