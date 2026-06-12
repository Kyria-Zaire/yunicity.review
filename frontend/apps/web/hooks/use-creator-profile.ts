"use client";

import type { CreatorPublicProfile } from "@yunicity/types";
import { CREATOR_PROFILE_CONTENTS_LIMIT_DEFAULT, isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

type ProfileState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "not_found" }
  | { status: "ready"; profile: CreatorPublicProfile };

export function useCreatorProfile(creatorId: string) {
  const api = useYunicityApi();
  const [state, setState] = useState<ProfileState>({ status: "loading" });

  const load = useCallback(async () => {
    const id = creatorId.trim();
    if (!id) {
      setState({ status: "not_found" });
      return;
    }
    setState({ status: "loading" });
    try {
      const profile = await api.getCreatorProfile(id, {
        limit: CREATOR_PROFILE_CONTENTS_LIMIT_DEFAULT,
        offset: 0,
      });
      setState({ status: "ready", profile });
    } catch (error) {
      if (isAuthError(error) && error.status === 404) {
        setState({ status: "not_found" });
        return;
      }
      setState({ status: "error" });
    }
  }, [api, creatorId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    state,
    reload: load,
  };
}
