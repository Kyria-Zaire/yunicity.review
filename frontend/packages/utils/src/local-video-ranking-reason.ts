import type { LocalVideoFeedItem, LocalVideoFeedReasonCode } from "@yunicity/types";

/**
 * Mise en mots du classement territorial du feed vidéo (VIDEO-03).
 *
 * Le frontend NE reconstruit PAS le classement : l'ordre et le motif sont
 * décidés par le backend (`app/core/local_video_feed_ranking.py`), qui seul
 * connaît le quartier résolu du spectateur. Cette fonction se contente de
 * décider si le libellé reçu est affichable, et avec quelle emphase.
 *
 * Elle applique une seule règle propre : le motif « Parce que tu es à … » est
 * réservé à `neighborhood_match`. C'est un garde-fou défensif — le serveur ne
 * l'émet déjà que dans ce cas — qui protège d'un libellé périmé servi depuis un
 * cache ou d'une régression serveur : mieux vaut ne rien afficher qu'affirmer à
 * tort à quelqu'un qu'il se trouve dans un quartier.
 */
const CODES_CONNUS = new Set<LocalVideoFeedReasonCode>([
  "neighborhood_match",
  "same_city",
  "territory_fallback",
]);

/** Amorce du motif de quartier, normalisée pour la comparaison. */
const MOTIF_QUARTIER = "parce que tu es";

export interface VideoRankingReasonView {
  visible: boolean;
  label: string;
  /** Vrai pour le quartier du spectateur — la seule raison mise en avant. */
  emphasis: boolean;
}

const INVISIBLE: VideoRankingReasonView = { visible: false, label: "", emphasis: false };

export function resolveVideoRankingReason(
  item: Pick<LocalVideoFeedItem, "reason_code" | "reason_label">,
): VideoRankingReasonView {
  const code = item.reason_code;
  const label = item.reason_label?.trim() ?? "";

  // Réponse d'une API antérieure à VIDEO-03, ou libellé vide : on n'invente rien.
  if (!code || !label || !CODES_CONNUS.has(code)) return INVISIBLE;

  const estQuartier = code === "neighborhood_match";
  const revendiqueUnQuartier = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .startsWith(MOTIF_QUARTIER);

  // Garde-fou : ce motif n'appartient qu'au tier quartier.
  if (revendiqueUnQuartier && !estQuartier) return INVISIBLE;

  return { visible: true, label, emphasis: estQuartier };
}
