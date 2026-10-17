"use client";

import { MyAgendaDesktopView } from "@/components/events/agenda/my-agenda-desktop-view";
import { MyAgendaMediumView } from "@/components/events/agenda/my-agenda-medium-view";
import { MyAgendaMobileView } from "@/components/events/agenda/my-agenda-mobile-view";
import { SortirAppShell } from "@/components/events/sortir/sortir-app-shell";
import { useEventsAgendaContext } from "@/hooks/use-events-agenda-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import type { LocalEvent } from "@yunicity/types";
import {
  MY_AGENDA_ERROR,
  MY_AGENDA_LOADING,
  MY_AGENDA_RETRY,
  buildMyAgendaGroups,
  countMyAgendaItems,
  filterAgendaUpcomingEvents,
} from "@yunicity/utils";
import { useCallback, useMemo, useState } from "react";

export function MyAgendaScreen() {
  const { user } = useAuth();
  const api = useYunicityApi();
  const agenda = useEventsAgendaContext(user?.city ?? "Reims");
  const [optimisticSaved, setOptimisticSaved] = useState<LocalEvent[] | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const savedEvents = optimisticSaved ?? agenda.savedEvents;
  const isGuest = !user;

  const groups = useMemo(
    () => buildMyAgendaGroups(savedEvents, agenda.city),
    [agenda.city, savedEvents],
  );
  const totalCount = useMemo(() => countMyAgendaItems(groups), [groups]);

  const handleRemove = useCallback(
    async (eventId: string) => {
      if (!user) return;
      setRemovingId(eventId);
      const previous = savedEvents;
      setOptimisticSaved(previous.filter((event) => event.id !== eventId));
      try {
        await api.toggleEventInterest(eventId);
      } catch {
        setOptimisticSaved(filterAgendaUpcomingEvents(previous));
      } finally {
        setRemovingId(null);
      }
    },
    [api, savedEvents, user],
  );

  if (agenda.loading) {
    return (
      <SortirAppShell>
        <p className="web-mobile-sortir-only px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {MY_AGENDA_LOADING}
        </p>
        <p className="sortir-tablet-desktop-only px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {MY_AGENDA_LOADING}
        </p>
        <p className="sortir-desktop-shell-only px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {MY_AGENDA_LOADING}
        </p>
      </SortirAppShell>
    );
  }

  if (agenda.error && !isGuest) {
    return (
      <SortirAppShell>
        <div className="mx-auto max-w-lg space-y-3 px-4 py-16 text-center">
          <p className="text-sm text-red-700">{MY_AGENDA_ERROR}</p>
          <button
            type="button"
            onClick={() => {
              setOptimisticSaved(null);
              agenda.reload();
            }}
            className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
          >
            {MY_AGENDA_RETRY}
          </button>
        </div>
      </SortirAppShell>
    );
  }

  const shared = {
    city: agenda.city,
    groups,
    totalCount,
    isGuest,
    removingId,
    onRemove: (eventId: string) => void handleRemove(eventId),
  };

  return (
    <SortirAppShell>
      <MyAgendaMobileView {...shared} />
      <MyAgendaMediumView {...shared} />
      <MyAgendaDesktopView {...shared} />
    </SortirAppShell>
  );
}
