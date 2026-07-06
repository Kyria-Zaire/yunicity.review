"use client";

import type { TerritoryMembershipKey } from "@yunicity/utils";
import {
  isTerritoryMember,
  joinTerritory,
  leaveTerritory,
} from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

/** Adhésion quartier / lieu — localStorage jusqu’à API viewer_is_member. */
export function useTerritoryMembership(key: TerritoryMembershipKey) {
  const [isMember, setIsMember] = useState(false);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setIsMember(isTerritoryMember(key));
    setReady(true);
  }, [key.city, key.kind, key.slug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === "yunicity.territoryMembership.v1") {
        refresh();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const join = useCallback(() => {
    joinTerritory(key);
    setIsMember(true);
  }, [key]);

  const leave = useCallback(() => {
    leaveTerritory(key);
    setIsMember(false);
  }, [key]);

  return { isMember, ready, join, leave, refresh };
}
