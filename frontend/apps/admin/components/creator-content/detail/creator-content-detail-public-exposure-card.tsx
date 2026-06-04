import type { PartnerCreatorContentAdmin } from "@yunicity/types";
import {
  creatorContentApproveSideEffectCopy,
  creatorContentApproveSideEffectWarningCopy,
  creatorContentIsFeedDistributed,
  creatorContentIsPartnerPageVisible,
  shouldShowCreatorContentApproveSideEffectWarning,
} from "@yunicity/utils";

interface CreatorContentDetailPublicExposureCardProps {
  content: PartnerCreatorContentAdmin;
}

function CheckRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-stone-200 bg-stone-50 text-stone-700"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className="text-xs">{ok ? "OK" : "Non"} · {detail}</span>
    </li>
  );
}

export function CreatorContentDetailPublicExposureCard({
  content,
}: CreatorContentDetailPublicExposureCardProps) {
  const partnerVisible = creatorContentIsPartnerPageVisible(content.status, content.is_active);
  const feedDistributed = creatorContentIsFeedDistributed(content.status) && content.is_active;
  const showApproveWarning = shouldShowCreatorContentApproveSideEffectWarning(content.status);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Exposition publique & effets
      </h2>
      <p className="mt-2 text-sm text-stone-700">{creatorContentApproveSideEffectCopy}</p>

      {showApproveWarning ? (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950">
          {creatorContentApproveSideEffectWarningCopy}
        </p>
      ) : null}

      <ul className="mt-4 space-y-2">
        <CheckRow
          label="Fiche partenaire (liste publique)"
          ok={partnerVisible}
          detail={
            partnerVisible
              ? "Contenu publié et actif"
              : "Requiert statut publié + is_active"
          }
        />
        <CheckRow
          label="Feed local (post partner_creator)"
          ok={feedDistributed}
          detail={
            feedDistributed
              ? "Sync feed après approbation staff"
              : "Non distribué tant que non publié"
          }
        />
        <CheckRow
          label="Organisation forcée en PUBLIC à l'approbation"
          ok={!showApproveWarning}
          detail={
            showApproveWarning
              ? "Effet backend confirmé si vous approuvez"
              : "Non applicable au statut actuel"
          }
        />
      </ul>
    </section>
  );
}
