"use client";

import { EventDesktopAboutProgram } from "@/components/events/desktop/event-desktop-about-program";
import { EventDesktopHero } from "@/components/events/desktop/event-desktop-hero";
import { EventDesktopLieuSavoir } from "@/components/events/desktop/event-desktop-lieu-savoir";
import { EventDesktopMeta } from "@/components/events/desktop/event-desktop-meta";
import { EventDesktopRightRail } from "@/components/events/desktop/event-desktop-right-rail";
import { EventDetailBreadcrumbs } from "@/components/events/event-detail-breadcrumbs";
import type { EventDetailContextState } from "@/hooks/use-event-detail-context";
import type { LocalEvent } from "@yunicity/types";
import {
  EVENT_DETAIL_BACK_SORTIR,
  buildEventDesktopBadges,
  buildEventDesktopGalleryUrls,
  buildEventDetailBreadcrumbs,
  buildEventKnowRows,
  buildEventProgramSteps,
  splitEventDesktopCopy,
} from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

type EventDesktopDetailViewProps = {
  event: LocalEvent;
  context: EventDetailContextState;
  toggling: boolean;
  isAuthenticated: boolean;
  onToggleInterest: () => void;
};

export function EventDesktopDetailView({
  event,
  context,
  toggling,
  isAuthenticated,
  onToggleInterest,
}: EventDesktopDetailViewProps) {
  const breadcrumbs = useMemo(() => buildEventDetailBreadcrumbs(event), [event]);
  const badges = useMemo(() => buildEventDesktopBadges(event), [event]);
  const galleryUrls = useMemo(
    () => buildEventDesktopGalleryUrls(event, context.culturalPlaces),
    [context.culturalPlaces, event],
  );
  const programSteps = useMemo(() => buildEventProgramSteps(event), [event]);
  const knowRows = useMemo(() => buildEventKnowRows(event), [event]);
  const copy = useMemo(() => splitEventDesktopCopy(event.description), [event.description]);

  return (
    <div className="event-desktop-shell web-desktop-event-detail-only space-y-5" data-event-desktop-detail="">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href="/sortir"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-yunicity-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {EVENT_DETAIL_BACK_SORTIR}
        </Link>
        <EventDetailBreadcrumbs items={breadcrumbs} />
      </div>

      <div className="event-desktop-grid gap-6">
        <div className="min-w-0 space-y-6">
          <EventDesktopHero title={event.title} imageUrls={galleryUrls} />
          <EventDesktopMeta
            event={event}
            badges={badges}
            subtitle={copy.subtitle}
            toggling={toggling}
            isAuthenticated={isAuthenticated}
            onToggleInterest={onToggleInterest}
          />
          <EventDesktopAboutProgram
            preview={copy.preview}
            fullText={copy.rest}
            programSteps={programSteps}
          />
          <EventDesktopLieuSavoir event={event} knowRows={knowRows} />
        </div>

        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <EventDesktopRightRail
            event={event}
            context={context}
            toggling={toggling}
            isAuthenticated={isAuthenticated}
            onToggleInterest={onToggleInterest}
          />
        </div>
      </div>
    </div>
  );
}
