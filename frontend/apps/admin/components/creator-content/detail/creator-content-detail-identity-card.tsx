import { CreatorContentDetailField } from "@/components/creator-content/detail/creator-content-detail-field";
import type { PartnerCreatorContentAdmin } from "@yunicity/types";
import {
  ADMIN_CREATOR_CONTENT_TYPE_LABEL,
  adminCreatorContentStatusLabel,
  formatCreatorContentDate,
  formatCreatorContentPublishedAt,
} from "@yunicity/utils";

interface CreatorContentDetailIdentityCardProps {
  content: PartnerCreatorContentAdmin;
}

export function CreatorContentDetailIdentityCard({
  content,
}: CreatorContentDetailIdentityCardProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Identité</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <CreatorContentDetailField label="ID" value={content.id} />
        <CreatorContentDetailField label="Titre" value={content.title} />
        <CreatorContentDetailField label="Type de contenu" value={ADMIN_CREATOR_CONTENT_TYPE_LABEL} />
        <CreatorContentDetailField
          label="Statut"
          value={adminCreatorContentStatusLabel(content.status)}
        />
        <CreatorContentDetailField
          label="Créé le"
          value={formatCreatorContentDate(content.created_at)}
        />
        <CreatorContentDetailField
          label="Mis à jour le"
          value={formatCreatorContentDate(content.updated_at)}
        />
        <CreatorContentDetailField
          label="Soumis le"
          value={formatCreatorContentDate(content.submitted_at)}
        />
        <CreatorContentDetailField
          label="Publié le"
          value={formatCreatorContentPublishedAt(content)}
        />
        <CreatorContentDetailField
          label="Actif (distribution)"
          value={content.is_active ? "Oui" : "Non"}
        />
      </dl>
    </section>
  );
}
