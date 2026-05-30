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
    try {
      const cultural = await api.getCulturalPlace(cleanSlug, cleanCity);
      setState({ status: "cultural", place: cultural });
      return;
    } catch {
      /* cultural_place prioritaire — essai partenaire */
    }
    try {
      const partner = await api.getPartner(cleanSlug, cleanCity);
      setState({ status: "partner", partner, kind: "partner" });
      return;
    } catch {
      setState({ status: "error" });
    }
  }, [api, slug, city]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
