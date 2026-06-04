"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type {
  AdminLocalEventDetail,
  LocalEventCancelPayload,
  LocalEventRejectPayload,
} from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export function useAdminEventDetail(eventId: string) {
  const { adminEventsApi } = useAuth();

  const [event, setEvent] = useState<AdminLocalEventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isModerating, setIsModerating] = useState(false);

  const load = useCallback(async () => {
    if (!eventId.trim()) {
      setEvent(null);
      setIsNotFound(true);
      setError("Identifiant événement invalide.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsNotFound(false);
    try {
      const data = await adminEventsApi.getEventDetail(eventId);
      setEvent(data);
    } catch (err) {
      setEvent(null);
      if (isAuthError(err) && err.status === 404 && err.code === "EVENT_NOT_FOUND") {
        setIsNotFound(true);
        setError("Événement introuvable.");
      } else {
        setIsNotFound(false);
        setError(
          isAuthError(err) ? err.message : "Impossible de charger l'événement pour le moment.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [adminEventsApi, eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const clearActionFeedback = useCallback(() => {
    setActionError(null);
    setActionSuccess(null);
  }, []);

  const approveEvent = useCallback(async () => {
    if (!event) {
      return false;
    }
    setIsModerating(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await adminEventsApi.approveEvent(event.id);
      await load();
      setActionSuccess("Événement approuvé.");
      return true;
    } catch (err) {
      setActionError(isAuthError(err) ? err.message : "Approbation impossible.");
      return false;
    } finally {
      setIsModerating(false);
    }
  }, [adminEventsApi, event, load]);

  const rejectEvent = useCallback(
    async (payload: LocalEventRejectPayload) => {
      if (!event || !payload.reason.trim()) {
        return false;
      }
      setIsModerating(true);
      setActionError(null);
      setActionSuccess(null);
      try {
        await adminEventsApi.rejectEvent(event.id, payload);
        await load();
        setActionSuccess("Événement refusé.");
        return true;
      } catch (err) {
        setActionError(isAuthError(err) ? err.message : "Refus impossible.");
        return false;
      } finally {
        setIsModerating(false);
      }
    },
    [adminEventsApi, event, load],
  );

  const cancelEvent = useCallback(
    async (payload: LocalEventCancelPayload) => {
      if (!event || !payload.reason.trim()) {
        return false;
      }
      setIsModerating(true);
      setActionError(null);
      setActionSuccess(null);
      try {
        const updated = await adminEventsApi.cancelEvent(event.id, payload);
        setEvent(updated);
        setActionSuccess("Événement annulé.");
        return true;
      } catch (err) {
        setActionError(isAuthError(err) ? err.message : "Annulation impossible.");
        return false;
      } finally {
        setIsModerating(false);
      }
    },
    [adminEventsApi, event],
  );

  return {
    event,
    isLoading,
    error,
    isNotFound,
    actionError,
    actionSuccess,
    isModerating,
    reload: load,
    clearActionFeedback,
    approveEvent,
    rejectEvent,
    cancelEvent,
  };
}
