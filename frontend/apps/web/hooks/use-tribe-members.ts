"use client";

import type { TribeMember, TribeMemberRole } from "@yunicity/types";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function useTribeMembers(slug: string, city: string, enabled: boolean) {
  const api = useYunicityApi();
  const [items, setItems] = useState<TribeMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.tribes.listTribeMembers(slug, city, { page_size: 50 });
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les membres.");
    } finally {
      setLoading(false);
    }
  }, [api.tribes, slug, city, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const removeMember = useCallback(
    async (userId: string) => {
      await api.tribes.removeTribeMember(slug, city, userId);
      await load();
    },
    [api.tribes, slug, city, load],
  );

  const setModerator = useCallback(
    async (userId: string, role: "member" | "moderator") => {
      await api.tribes.updateTribeMemberRole(slug, city, userId, { role });
      await load();
    },
    [api.tribes, slug, city, load],
  );

  return { items, loading, error, reload: load, removeMember, setModerator };
}

export function canModerateTribe(role: TribeMemberRole | null | undefined): boolean {
  return role === "owner" || role === "moderator";
}

export function canManageTribe(role: TribeMemberRole | null | undefined): boolean {
  return role === "owner";
}
