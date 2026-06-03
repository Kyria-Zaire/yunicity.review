"use client";

import { PartnerActionReasonDialog } from "@/components/partners/detail/partner-action-reason-dialog";
import { PartnerActivateDialog } from "@/components/partners/detail/partner-activate-dialog";
import { PartnerCreateProfileDialog } from "@/components/partners/detail/partner-create-profile-dialog";
import type {
  AdminPartnerActivatePayload,
  AdminPartnerCapabilities,
  AdminPartnerCreateProfilePayload,
  AdminPartnerPausePayload,
  AdminPartnerUpgradePremiumPayload,
} from "@yunicity/types";
import { useState } from "react";

type DialogKind = "create" | "activate" | "pause" | "premium" | null;

interface PartnerDetailActionsSectionProps {
  organizationName: string;
  capabilities: AdminPartnerCapabilities;
  isSubmitting: boolean;
  onCreateProfile: (payload: AdminPartnerCreateProfilePayload) => Promise<boolean>;
  onActivate: (payload: AdminPartnerActivatePayload) => Promise<boolean>;
  onPause: (payload: AdminPartnerPausePayload) => Promise<boolean>;
  onUpgradePremium: (payload: AdminPartnerUpgradePremiumPayload) => Promise<boolean>;
}

export function PartnerDetailActionsSection({
  organizationName,
  capabilities,
  isSubmitting,
  onCreateProfile,
  onActivate,
  onPause,
  onUpgradePremium,
}: PartnerDetailActionsSectionProps) {
  const [openDialog, setOpenDialog] = useState<DialogKind>(null);

  const hasAnyAction =
    capabilities.can_create_profile ||
    capabilities.can_activate ||
    capabilities.can_pause ||
    capabilities.can_upgrade_premium;

  if (!hasAnyAction) {
    return null;
  }

  async function handleCreate(payload: AdminPartnerCreateProfilePayload) {
    const ok = await onCreateProfile(payload);
    if (ok) {
      setOpenDialog(null);
    }
  }

  async function handleActivate(payload: AdminPartnerActivatePayload) {
    const ok = await onActivate(payload);
    if (ok) {
      setOpenDialog(null);
    }
  }

  async function handlePause(reason: string | null) {
    const ok = await onPause({ reason });
    if (ok) {
      setOpenDialog(null);
    }
  }

  async function handlePremium(reason: string | null) {
    const ok = await onUpgradePremium({ reason });
    if (ok) {
      setOpenDialog(null);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Actions métier
      </h2>
      <p className="mt-2 text-sm text-stone-600">
        Transitions explicites (ADMIN-02D3). Chaque action est journalisée côté serveur.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {capabilities.can_create_profile ? (
          <button
            type="button"
            onClick={() => setOpenDialog("create")}
            disabled={isSubmitting}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-60"
          >
            Créer le profil partenaire
          </button>
        ) : null}
        {capabilities.can_activate ? (
          <button
            type="button"
            onClick={() => setOpenDialog("activate")}
            disabled={isSubmitting}
            className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
          >
            Activer
          </button>
        ) : null}
        {capabilities.can_pause ? (
          <button
            type="button"
            onClick={() => setOpenDialog("pause")}
            disabled={isSubmitting}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-60"
          >
            Mettre en pause
          </button>
        ) : null}
        {capabilities.can_upgrade_premium ? (
          <button
            type="button"
            onClick={() => setOpenDialog("premium")}
            disabled={isSubmitting}
            className="rounded-lg border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-950 hover:bg-violet-100 disabled:opacity-60"
          >
            Passer en premium
          </button>
        ) : null}
      </div>

      <PartnerCreateProfileDialog
        organizationName={organizationName}
        isOpen={openDialog === "create"}
        isSubmitting={isSubmitting}
        onClose={() => setOpenDialog(null)}
        onConfirm={(payload) => void handleCreate(payload)}
      />
      <PartnerActivateDialog
        organizationName={organizationName}
        isOpen={openDialog === "activate"}
        isSubmitting={isSubmitting}
        onClose={() => setOpenDialog(null)}
        onConfirm={(payload) => void handleActivate(payload)}
      />
      <PartnerActionReasonDialog
        title="Mettre en pause"
        description={`Le partenaire ${organizationName} sera retiré du catalogue public (offres, événements, QR). La visibilité organisation n'est pas modifiée.`}
        confirmLabel="Confirmer la pause"
        confirmTone="danger"
        isOpen={openDialog === "pause"}
        isSubmitting={isSubmitting}
        onClose={() => setOpenDialog(null)}
        onConfirm={(reason) => void handlePause(reason)}
      />
      <PartnerActionReasonDialog
        title="Passer en premium"
        description={`Élève le statut partenaire de ${organizationName} vers premium (depuis actif uniquement).`}
        confirmLabel="Confirmer premium"
        isOpen={openDialog === "premium"}
        isSubmitting={isSubmitting}
        onClose={() => setOpenDialog(null)}
        onConfirm={(reason) => void handlePremium(reason)}
      />
    </section>
  );
}
