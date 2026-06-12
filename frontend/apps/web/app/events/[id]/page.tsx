import { EventDetailScreen } from "@/components/events/event-detail-screen";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPageMetadata, plainTextExcerpt, truncateForMeta } from "@/lib/seo/metadata";
import { fetchEventForSeo } from "@/lib/seo/public-fetch";
import { resolveMediaUrl } from "@/lib/seo/site";
import { buildEventJsonLd } from "@/lib/seo/structured-data";
import type { Metadata } from "next";

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatEventDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Reims";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const path = `/events/${id}`;
  const event = await fetchEventForSeo(id);

  if (!event) {
    return buildPageMetadata({
      title: "Événement introuvable",
      description: "Cet événement n'est pas disponible sur Yunicity.",
      path,
      noIndex: true,
    });
  }

  const dateLabel = formatEventDateLabel(event.starts_at);
  const title = `${event.title} — ${dateLabel}`;
  const description = truncateForMeta(
    plainTextExcerpt(event.description) ||
      `${event.title} à ${event.location_name}, Reims. Réservez votre place sur Yunicity.`,
  );
  const image = resolveMediaUrl(event.cover_image_url);

  return buildPageMetadata({
    title,
    description,
    path,
    image,
    imageAlt: event.title,
  });
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const path = `/events/${id}`;
  const event = await fetchEventForSeo(id);

  return (
    <>
      {event ? <JsonLd data={buildEventJsonLd(event, path)} /> : null}
      <EventDetailScreen eventId={id} />
    </>
  );
}
