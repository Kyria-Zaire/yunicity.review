"use client";

import { EventMobileDetailHero } from "@/components/events/mobile/event-mobile-detail-hero";
import { EventMobileDetailInfoCard } from "@/components/events/mobile/event-mobile-detail-info-card";
import { EventMobileDetailMeta } from "@/components/events/mobile/event-mobile-detail-meta";
import {
  EventMobileAboutSection,
  EventMobileAgendaSection,
  EventMobileKnowSection,
  EventMobileLieuSection,
  EventMobileProgramSection,
  EventMobileSimilarSection,
} from "@/components/events/mobile/event-mobile-detail-sections";
import { EventMobileDetailShareSave } from "@/components/events/mobile/event-mobile-detail-share-save";
import type { EventDetailContextState } from "@/hooks/use-event-detail-context";
import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";
import {
  buildEventDesktopBadges,
  buildEventDesktopGalleryUrls,
  buildEventDetailBreadcrumbs,
  buildEventKnowRows,
  buildEventProgramSteps,
  splitEventDesktopCopy,
} from "@yunicity/utils";
import { useMemo } from "react";

type EventMobileDetailViewProps = {
  event: LocalEvent;
  context: EventDetailContextState;
  venuePlace: CulturalPlaceListItem | null;
  toggling: boolean;
  isAuthenticated: boolean;
  onToggleInterest: () => void;
};

export function EventMobileDetailView({
  event,
  context,
  toggling,
  isAuthenticated,
  onToggleInterest,
}: EventMobileDetailViewProps) {
  const badges = useMemo(() => buildEventDesktopBadges(event), [event]);
  const breadcrumbs = useMemo(() => buildEventDetailBreadcrumbs(event), [event]);
  const categoryLabel = breadcrumbs[1]?.label ?? "Sortir";
  const galleryUrls = useMemo(
    () => buildEventDesktopGalleryUrls(event, context.culturalPlaces),
    [context.culturalPlaces, event],
  );
  const programSteps = useMemo(() => buildEventProgramSteps(event), [event]);
  const knowRows = useMemo(() => buildEventKnowRows(event), [event]);
  const copy = useMemo(() => splitEventDesktopCopy(event.description), [event.description]);
  const related = context.relatedEvents.filter((item) => item.id !== event.id);

  return (
    <div
      className="web-mobile-event-detail-only min-w-0 bg-[#F4F5F7] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]"
      data-event-mobile-detail=""
    >
      <div className="space-y-4">
        <EventMobileDetailHero
          title={event.title}
          imageUrls={galleryUrls}
          categoryLabel={categoryLabel}
        />
        <EventMobileDetailMeta event={event} badges={badges} subtitle={copy.subtitle} />
        <EventMobileDetailInfoCard
          event={event}
          toggling={toggling}
          isAuthenticated={isAuthenticated}
          onToggleInterest={onToggleInterest}
        />
        <EventMobileDetailShareSave
          eventId={event.id}
          title={event.title}
          interestedByMe={event.interested_by_me}
          toggling={toggling}
          isAuthenticated={isAuthenticated}
          onToggleInterest={onToggleInterest}
        />
        <EventMobileAboutSection preview={copy.preview} fullText={copy.rest} />
        <EventMobileProgramSection steps={programSteps} />
        <EventMobileLieuSection event={event} />
        <EventMobileKnowSection rows={knowRows} />
        <EventMobileAgendaSection />
        <EventMobileSimilarSection events={related} />
      </div>
    </div>
  );
}
