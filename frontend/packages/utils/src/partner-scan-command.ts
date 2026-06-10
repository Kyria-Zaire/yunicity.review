/** Partner scan field terminal helpers (PARTNER-SCAN-V2-01) — UX pure, session state. */

export type PartnerScanPhase = "idle" | "resolving" | "resolved" | "redeemed" | "error";

export type PartnerScanInputMode = "manual";

export interface PartnerScanSignal {
  phase: PartnerScanPhase;
  title: string;
  description: string;
}

export interface PartnerScanNextAction {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  action: "focus-input" | "confirm-redeem" | "new-scan" | "retry";
}

export interface PartnerScanKpiCard {
  id: string;
  label: string;
  value: string;
  hint: string;
}

export function derivePartnerScanPhase(input: {
  isResolving: boolean;
  passportResolved: boolean;
  redeemSuccess: boolean;
  hasBlockingError: boolean;
}): PartnerScanPhase {
  if (input.isResolving) {
    return "resolving";
  }
  if (input.redeemSuccess) {
    return "redeemed";
  }
  if (input.hasBlockingError && !input.passportResolved) {
    return "error";
  }
  if (input.passportResolved) {
    return "resolved";
  }
  return "idle";
}

export function buildPartnerScanSignal(phase: PartnerScanPhase, errorMessage?: string | null): PartnerScanSignal {
  switch (phase) {
    case "resolving":
      return {
        phase,
        title: "Recherche du Passport…",
        description: "Vérification en cours.",
      };
    case "resolved":
      return {
        phase,
        title: "Passport trouvé.",
        description: "Vérifiez les informations avant de valider l'interaction.",
      };
    case "redeemed":
      return {
        phase,
        title: "Interaction validée.",
        description: "Le tampon ou l'avantage a bien été enregistré.",
      };
    case "error":
      return {
        phase,
        title: "Impossible de valider.",
        description: errorMessage?.trim() || "Une erreur est survenue. Réessayez.",
      };
    default:
      return {
        phase: "idle",
        title: "Scanner prêt.",
        description: "Saisissez un QR, un numéro Passport ou un identifiant compatible.",
      };
  }
}

export function buildPartnerScanNextAction(
  phase: PartnerScanPhase,
  canRedeem: boolean,
): PartnerScanNextAction {
  switch (phase) {
    case "resolved":
      return {
        id: "confirm",
        title: "Confirmez l'interaction terrain.",
        description: "Vérifiez le citoyen et le partenaire avant validation.",
        ctaLabel: canRedeem ? "Valider l'interaction" : "Choisir une offre",
        action: "confirm-redeem",
      };
    case "redeemed":
      return {
        id: "next",
        title: "Passez au prochain citoyen.",
        description: "Le scan est terminé, vous pouvez traiter un autre Passport.",
        ctaLabel: "Nouveau scan",
        action: "new-scan",
      };
    case "error":
      return {
        id: "retry",
        title: "Reprenez la vérification.",
        description: "Corrigez la saisie ou réessayez.",
        ctaLabel: "Réessayer",
        action: "retry",
      };
    default:
      return {
        id: "scan",
        title: "Scannez ou recherchez un Passport.",
        description: "Utilisez le QR citoyen ou saisissez le numéro manuellement.",
        ctaLabel: "Focus champ de scan",
        action: "focus-input",
      };
  }
}

const PHASE_STATUS_LABEL: Record<PartnerScanPhase, string> = {
  idle: "Prêt",
  resolving: "Recherche…",
  resolved: "Résolu",
  redeemed: "Validé",
  error: "Erreur",
};

export function formatPartnerScanLastValidation(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function buildPartnerScanKpiCards(input: {
  phase: PartnerScanPhase;
  inputMode: PartnerScanInputMode;
  lastValidationAt: string | null;
}): PartnerScanKpiCard[] {
  return buildPartnerScanSessionKpis(input);
}

export function buildPartnerScanSessionKpis(input: {
  phase: PartnerScanPhase;
  inputMode: PartnerScanInputMode;
  lastValidationAt: string | null;
}): PartnerScanKpiCard[] {
  return [
    {
      id: "mode",
      label: "Mode",
      value: input.inputMode === "manual" ? "Saisie manuelle" : "Saisie manuelle",
      hint: "Session locale",
    },
    {
      id: "status",
      label: "Statut",
      value: PHASE_STATUS_LABEL[input.phase],
      hint: "État du terminal",
    },
    {
      id: "last",
      label: "Dernière validation",
      value: formatPartnerScanLastValidation(input.lastValidationAt),
      hint: "Succès dans cette session",
    },
  ];
}

export const PARTNER_SCAN_CAMERA_NOTICE =
  "La lecture caméra sera ajoutée dans une version ultérieure. Utilisez la saisie QR ou numéro Passport.";
