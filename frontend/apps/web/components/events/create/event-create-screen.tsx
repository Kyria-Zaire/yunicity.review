"use client";

import { EventCreateAppShell } from "@/components/events/create/event-create-app-shell";
import { EventCreateDesktopScreen } from "@/components/events/create/desktop/event-create-desktop-screen";
import { EventCreateMediumScreen } from "@/components/events/create/medium/event-create-medium-screen";
import { EventCreateMobileScreen } from "@/components/events/create/mobile/event-create-mobile-screen";
import { useEventCreateContext } from "@/hooks/use-event-create-context";
import { EVENT_CREATE_LOADING } from "@yunicity/utils";

export function EventCreateScreen() {
  const ctx = useEventCreateContext();

  if (ctx.loading) {
    return (
      <EventCreateAppShell>
        <p className="px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {EVENT_CREATE_LOADING}
        </p>
      </EventCreateAppShell>
    );
  }

  return (
    <EventCreateAppShell>
      <EventCreateMobileScreen ctx={ctx} />
      <div className="web-medium-event-create-only">
        <EventCreateMediumScreen ctx={ctx} />
      </div>
      <div className="web-desktop-event-create-only">
        <EventCreateDesktopScreen ctx={ctx} />
      </div>
    </EventCreateAppShell>
  );
}
