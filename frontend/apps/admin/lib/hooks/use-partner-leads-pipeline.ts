"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { PartnerLead } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 100;

async function fetchAllPartnerLeads(
  list: (params: { city?: string; page: number; page_size: number }) => Promise<{
    items: PartnerLead[];
    total: number;
  }>,
  city: string,
): Promise<PartnerLead[]> {
  const first = await list({ city, page: 1, page_size: PAGE_SIZE });
  const all = [...first.items];
  const pages = Math.ceil(first.total / PAGE_SIZE);
  for (let page = 2; page <= pages; page += 1) {
    const next = await list({ city, page, page_size: PAGE_SIZE });
    all.push(...next.items);
  }
  return all;
}

export function usePartnerLeadsPipeline(city: string = "Reims") {
  const { partnerLeadsApi } = useAuth();
  const [leads, setLeads] = useState<PartnerLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const all = await fetchAllPartnerLeads(
        (params) => partnerLeadsApi.listPartnerLeads(params),
        city,
      );
      setLeads(all);
    } catch (err) {
      setError(
        isAuthError(err)
          ? err.message
          : "Impossible de charger le pipeline prospects. Réessayez dans un instant.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [partnerLeadsApi, city]);

  useEffect(() => {
    void load();
  }, [load]);

  return { leads, isLoading, error, reload: load };
}
