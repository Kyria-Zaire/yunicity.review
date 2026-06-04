import { EventDetailField } from "@/components/events/detail/event-detail-field";
import type { AdminLocalEventDetail } from "@yunicity/types";
import { adminPartnerDetailPath, eventVisibilityLabel, VERIFICATION_STATUS_LABELS } from "@yunicity/utils";
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
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Organisation
        </h2>
        <p className="mt-4 text-sm text-stone-600">Aucune organisation liée à cet événement.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Organisation
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <EventDetailField label="Nom" value={org.name} />
        <EventDetailField label="Slug" value={org.slug} />
        <EventDetailField
          label="Vérification"
          value={verificationLabel(org.verification_status)}
        />
        <EventDetailField label="Visibilité" value={eventVisibilityLabel(org.visibility)} />
      </dl>
      <Link
        href={adminPartnerDetailPath(org.id)}
        className="mt-4 inline-flex text-sm font-medium text-stone-800 underline-offset-2 hover:underline"
      >
        Voir la fiche organisation →
      </Link>
    </section>
  );
}
