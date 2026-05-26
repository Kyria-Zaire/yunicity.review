"use client";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useCallback, useEffect, useState } from "react";

/** Compteur non-lus pour badge sidebar (discret). */
export function useNotificationUnread(): number {
  const yunicityApi = useYunicityApi();
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await yunicityApi.notifications.listInbox(1);
      setUnread(data.unread_count);
    } catch {
      setUnread(0);
    }
  }, [yunicityApi]);

  useEffect(() => {
    void load();
  }, [load]);

  return unread;
}
