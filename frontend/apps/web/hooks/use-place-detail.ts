"use client";

import type { CulturalPlaceDetail, PartnerPublic } from "@yunicity/types";
import type { PlaceSlugKind } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export type PlaceDetailState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "cultural"; place: CulturalPlaceDetail }
  | { status: "partner"; partner: PartnerPublic; kind: PlaceSlugKind };

export function usePlaceDetail(slug: string, city: string) {
  const api = useYunicityApi();
  const [state, setState] = useState<PlaceDetailState>({ status: "loading" });

  const load = useCallback(async () => {
    const cleanSlug = slug.trim();
    const cleanCity = city.trim() || "Reims";
    if (!cleanSlug) {
      setState({ status: "error" });
      return;
    }
    setState({ status: "loading" });
    // Probe en parallèle : un slug est soit un lieu culturel, soit un
    // partenaire. On lance les deux requêtes simultanément pour supprimer le
    // roundtrip séquentiel (404 cultural → partner) du chemin critique, tout en
    // gardant la priorité au lieu culturel quand les deux répondent.
    const [culturalRes, partnerRes] = await Promise.allSettled([
      api.getCulturalPlace(cleanSlug, cleanCity),
      api.getPartner(cleanSlug, cleanCity),
    ]);

    if (culturalRes.status === "fulfilled") {
      setState({ status: "cultural", place: culturalRes.value });
      return;
    }
    if (partnerRes.status === "fulfilled") {
      setState({ status: "partner", partner: partnerRes.value, kind: "partner" });
      return;
    }
    setState({ status: "error" });
  }, [api, slug, city]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
