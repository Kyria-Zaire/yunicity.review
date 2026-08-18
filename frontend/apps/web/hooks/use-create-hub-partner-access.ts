"use client";

import { useEffect, useRef, useState } from "react";

import { filterPartnerPortalOrganizations } from "@yunicity/utils";

import { useAuth } from "@/lib/auth/auth-provider";
import type { PartnerAccessStatus } from "@/lib/create-hub/create-hub-actions";

/**
 * Résout l'accès partenaire Create Hub — fail-closed, sans flash optimiste.
 */
export function useCreateHubPartnerAccess(): { status: PartnerAccessStatus } {
  const { isAuthenticated, yunicityApi } = useAuth();
  const [status, setStatus] = useState<PartnerAccessStatus>("idle");
  const generationRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) {
      generationRef.current += 1;
      setStatus("idle");
      return;
    }

    const generation = generationRef.current + 1;
    generationRef.current = generation;
    setStatus("loading");

    void yunicityApi
      .listMyOrganizations()
      .then((response) => {
        if (generationRef.current !== generation) return;
        setStatus(filterPartnerPortalOrganizations(response.items).length > 0 ? "allowed" : "denied");
      })
      .catch(() => {
        if (generationRef.current !== generation) return;
        setStatus("denied");
      });

    return () => {
      generationRef.current += 1;
    };
  }, [isAuthenticated, yunicityApi]);

  return { status };
}
