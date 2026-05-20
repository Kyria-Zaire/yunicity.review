"use client";

import type { Tribe, TribeMember } from "@yunicity/types";
import { TRIBE_NOT_FOUND, isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function useTribeDetail(slug: string, city: string) {
  const api = useYunicityApi();
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.tribes.getTribe(slug, city);
      setTribe(data);
    } catch (err) {
      if (!isAuthError(err)) {
        setError(TRIBE_NOT_FOUND);
      }
    } finally {
      setLoading(false);
    }
  }, [api.tribes, slug, city]);

  useEffect(() => {
    void load();
  }, [load]);

  const join = useCallback(
    async (charterAccepted: boolean): Promise<TribeMember | null> => {
      if (!charterAccepted) {
        setActionError("Acceptez la charte pour rejoindre.");
        return null;
      }
      setJoining(true);
      setActionError(null);
      try {
        await api.tribes.joinTribe(slug, city, { charter_accepted: true });
        await load();
        return null;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Impossible de rejoindre pour le moment.";
        setActionError(message);
        return null;
      } finally {
        setJoining(false);
      }
    },
    [api.tribes, slug, city, load],
  );

  const leave = useCallback(async () => {
    setLeaving(true);
    setActionError(null);
    try {
      await api.tribes.leaveTribe(slug, city);
      await load();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible de quitter pour le moment.";
      setActionError(message);
    } finally {
      setLeaving(false);
    }
  }, [api.tribes, slug, city, load]);

  return {
    tribe,
    loading,
    error,
    actionError,
    joining,
    leaving,
    reload: load,
    join,
    leave,
  };
}
