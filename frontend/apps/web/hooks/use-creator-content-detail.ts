"use client";

import type { CreatorPublicDetailResponse } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

type DetailState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "not_found" }
  | { status: "ready"; detail: CreatorPublicDetailResponse };

export function useCreatorContentDetail(contentId: string) {
  const api = useYunicityApi();
  const [state, setState] = useState<DetailState>({ status: "loading" });

  const load = useCallback(async () => {
    const id = contentId.trim();
    if (!id) {
      setState({ status: "not_found" });
      return;
    }
    setState({ status: "loading" });
    try {
      const detail = await api.getCreatorContentDetail(id);
      setState({ status: "ready", detail });
    } catch (error) {
      if (isAuthError(error) && error.status === 404) {
        setState({ status: "not_found" });
        return;
      }
      setState({ status: "error" });
    }
  }, [api, contentId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    state,
    reload: load,
  };
}
