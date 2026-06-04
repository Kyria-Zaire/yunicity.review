import type { PartnerCreatorContentAdmin } from "@yunicity/types";
import { creatorContentFeedSyncCopy, creatorContentIsFeedDistributed } from "@yunicity/utils";

interface CreatorContentDetailFeedSyncCardProps {
  content: PartnerCreatorContentAdmin;
}

export function CreatorContentDetailFeedSyncCard({
  content,
}: CreatorContentDetailFeedSyncCardProps) {
  const synced = creatorContentIsFeedDistributed(content.status) && content.is_active;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Distribution feed
      </h2>
      <p className="mt-2 text-sm text-stone-700">{creatorContentFeedSyncCopy}</p>
      <p className="mt-3 text-sm text-stone-600">
        {synced
          ? "Ce contenu est publié : un post feed partner_creator devrait être actif (sync backend à l'approbation)."
          : "Pas encore synchronisé vers le feed — approbation staff requise."}
      </p>
    </section>
  );
}
