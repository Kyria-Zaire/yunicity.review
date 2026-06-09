import { EventDetailCard } from "@/components/events/detail/event-detail-card";
import { EventDetailField } from "@/components/events/detail/event-detail-field";
import { partnerPublicPlaceUrl } from "@/lib/partners-workspace";
import type { AdminLocalEventDetail } from "@yunicity/types";
import {
  adminPartnerDetailPath,
  eventVisibilityLabel,
  VERIFICATION_STATUS_LABELS,
} from "@yunicity/utils";
import { Building2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface EventDetailOrganizationCardProps {
  event: AdminLocalEventDetail;
}

function verificationLabel(status: string): string {
  return VERIFICATION_STATUS_LABELS[status as keyof typeof VERIFICATION_STATUS_LABELS] ?? status;
}

export function EventDetailOrganizationCard({ event }: EventDetailOrganizationCardProps) {
  const org = event.organization;

  if (!org) {
    return (
      <EventDetailCard title="Organisation" subtitle="Organisateur de l'événement">
        <p className="text-sm text-yunicity-ink-muted">Aucune organisation liée à cet événement.</p>
      </EventDetailCard>
    );
  }

  const adminHref = adminPartnerDetailPath(org.id);
  const publicHref = partnerPublicPlaceUrl(org.slug, event.city);

  return (
    <EventDetailCard
      title="Organisation"
      subtitle="Partenaire à l'origine de la soumission"
      headerAction={
        <span className="inline-flex rounded-lg bg-yunicity-primary-soft p-2 text-yunicity-primary">
          <Building2 className="h-4 w-4" aria-hidden />
        </span>
      }
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        <EventDetailField label="Nom" value={org.name} />
        <EventDetailField label="Slug" value={org.slug} />
        <EventDetailField
          label="Vérification"
          value={verificationLabel(org.verification_status)}
        />
        <EventDetailField label="Visibilité org" value={eventVisibilityLabel(org.visibility)} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-4">
        <Link
          href={adminHref}
          className="text-sm font-medium text-yunicity-primary underline-offset-2 hover:underline"
        >
          Fiche organisation admin →
        </Link>
        <a
          href={publicHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-yunicity-ink underline-offset-2 hover:underline"
        >
          Fiche publique partenaire
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </EventDetailCard>
  );
}
