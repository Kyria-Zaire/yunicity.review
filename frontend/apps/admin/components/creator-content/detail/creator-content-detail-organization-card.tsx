import { CreatorContentDetailField } from "@/components/creator-content/detail/creator-content-detail-field";
import { partnerPublicPlaceUrl } from "@/lib/partners-workspace";
import type { PartnerCreatorContentAdmin } from "@yunicity/types";
import { buildCreatorContentOrganizationAdminPath } from "@yunicity/utils";
import Link from "next/link";

interface CreatorContentDetailOrganizationCardProps {
  content: PartnerCreatorContentAdmin;
}

export function CreatorContentDetailOrganizationCard({
  content,
}: CreatorContentDetailOrganizationCardProps) {
  const org = content.organization;
  const adminHref = buildCreatorContentOrganizationAdminPath(org.id);
  const publicHref = partnerPublicPlaceUrl(org.slug, org.city);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Organisation
      </h2>
      <p className="mt-2 text-xs text-stone-500">
        Vérification et visibilité organisation : consulter la fiche partenaire admin (non exposées
        dans la réponse contenu).
      </p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <CreatorContentDetailField label="ID organisation" value={org.id} />
        <CreatorContentDetailField label="Nom" value={org.name} />
        <CreatorContentDetailField label="Slug" value={org.slug} />
        <CreatorContentDetailField label="Ville" value={org.city} />
        <CreatorContentDetailField label="Vérification" value="Voir fiche organisation" />
        <CreatorContentDetailField label="Visibilité" value="Voir fiche organisation" />
      </dl>
      <div className="mt-4 flex flex-wrap gap-4">
        <Link
          href={adminHref}
          className="text-sm font-medium text-stone-800 underline-offset-2 hover:underline"
        >
          Fiche organisation admin →
        </Link>
        <a
          href={publicHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-stone-800 underline-offset-2 hover:underline"
        >
          Fiche publique partenaire ↗
        </a>
      </div>
    </section>
  );
}
