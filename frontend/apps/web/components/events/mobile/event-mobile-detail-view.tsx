"use client";

import {
  EventMobileDetailActionBar,
  EventMobileDetailHero,
  EventMobileDetailInfoCard,
  EventMobileDetailOrganizer,
  EventMobileDetailParticipants,
  EventMobileDetailPassportOffers,
  EventMobileDetailTabs,
} from "@/components/events/mobile";
import type { EventDetailContextState } from "@/hooks/use-event-detail-context";
import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";
import { EVENT_DETAIL_SHARE_COPIED } from "@yunicity/utils";
import { useCallback, useState } from "react";

type EventMobileDetailViewProps = {
  event: LocalEvent;
  context: EventDetailContextState;
  venuePlace: CulturalPlaceListItem | null;
  toggling: boolean;
  isAuthenticated: boolean;
  onToggleInterest: () => void;
};

/** Vue mobile complète détail événement (MOBILE-SORTIR-02). */
export function EventMobileDetailView({
  event,
  context,
  venuePlace,
  toggling,
  isAuthenticated,
  onToggleInterest,
}: EventMobileDetailViewProps) {
  const [shareHint, setShareHint] = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/events/${event.id}`
        : `/events/${event.id}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: event.title,
          text: event.description?.slice(0, 120),
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint(EVENT_DETAIL_SHARE_COPIED);
      window.setTimeout(() => setShareHint(null), 2500);
    } catch {
      /* annulation */
    }
  }, [event.description, event.id, event.title]);

  return (
    <div className="web-mobile-event-detail-only min-w-0 bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <EventMobileDetailHero
        event={event}
        culturalPlaces={context.culturalPlaces}
        interestedByMe={event.interested_by_me}
        toggling={toggling}
        isAuthenticated={isAuthenticated}
        onToggleInterest={onToggleInterest}
        onShare={() => void handleShare()}
      />

      {shareHint ? (
        <p className="mx-4 mt-3 rounded-full bg-neutral-900 px-4 py-2 text-center text-xs text-white">
          {shareHint}
        </p>
      ) : null}

      <div className="space-y-6 pb-4 pt-0">
        <EventMobileDetailInfoCard event={event} />
        <EventMobileDetailTabs event={event} context={context} venuePlace={venuePlace} />
        <EventMobileDetailPassportOffers offers={context.passportOffers} />
        <EventMobileDetailParticipants interestCount={event.interest_count ?? 0} />
        {event.organization ? (
          <EventMobileDetailOrganizer organization={event.organization} city={event.city} />
        ) : null}
      </div>

      <EventMobileDetailActionBar
        interestedByMe={event.interested_by_me}
        toggling={toggling}
        isAuthenticated={isAuthenticated}
        onToggleInterest={onToggleInterest}
        onShare={() => void handleShare()}
      />
    </div>
  );
}
