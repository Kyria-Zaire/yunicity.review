"use client";

import { EventDesktopAboutProgram } from "@/components/events/desktop/event-desktop-about-program";
import { EventDesktopHero } from "@/components/events/desktop/event-desktop-hero";
import { EventDesktopLieuSavoir } from "@/components/events/desktop/event-desktop-lieu-savoir";
import { EventDesktopMeta } from "@/components/events/desktop/event-desktop-meta";
import { EventMediumAgendaBar } from "@/components/events/medium/event-medium-agenda-bar";
import { EventMediumHeader } from "@/components/events/medium/event-medium-header";
import { EventMediumParticipateCard } from "@/components/events/medium/event-medium-participate-card";
import { EventMediumSimilarRail } from "@/components/events/medium/event-medium-similar-rail";
import type { EventDetailContextState } from "@/hooks/use-event-detail-context";
import type { LocalEvent } from "@yunicity/types";
import {
  buildEventDesktopBadges,
  buildEventDesktopGalleryUrls,
  buildEventDetailBreadcrumbs,
  buildEventKnowRows,
  buildEventProgramSteps,
  splitEventDesktopCopy,
} from "@yunicity/utils";
import { useMemo } from "react";

type EventMediumDetailViewProps = {
  event: LocalEvent;
  context: EventDetailContextState;
  toggling: boolean;
  isAuthenticated: boolean;
  onToggleInterest: () => void;
};

export function EventMediumDetailView({
  event,
  context,
  toggling,
  isAuthenticated,
  onToggleInterest,
}: EventMediumDetailViewProps) {
  const breadcrumbs = useMemo(() => buildEventDetailBreadcrumbs(event), [event]);
  const categoryLabel = breadcrumbs[1]?.label ?? "Sortir";
  const badges = useMemo(() => buildEventDesktopBadges(event), [event]);
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
      className="event-medium-shell mx-auto w-full max-w-[960px] space-y-6 px-6 py-3 pb-12 sm:px-8"
      data-event-medium-detail=""
    >
      <EventMediumHeader categoryLabel={categoryLabel} />
      <EventDesktopHero title={event.title} imageUrls={galleryUrls} />
      <EventDesktopMeta
        event={event}
        badges={badges}
        subtitle={copy.subtitle}
        toggling={toggling}
        isAuthenticated={isAuthenticated}
        onToggleInterest={onToggleInterest}
      />
      <EventMediumParticipateCard
        event={event}
        toggling={toggling}
        isAuthenticated={isAuthenticated}
        onToggleInterest={onToggleInterest}
      />
      <EventDesktopAboutProgram
        preview={copy.preview}
        fullText={copy.rest}
        programSteps={programSteps}
      />
      <EventDesktopLieuSavoir event={event} knowRows={knowRows} placeLayout="stacked" />
      <EventMediumAgendaBar />
      <EventMediumSimilarRail events={related} />
    </div>
  );
}
