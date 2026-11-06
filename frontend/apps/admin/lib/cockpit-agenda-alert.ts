import type { AdminCockpitAgendaHealth } from "@yunicity/types";

/**
 * Présentation de l'alerte agenda — RF-03B.
 *
 * La décision (alerter ou non, seuil, libellé) vient du backend
 * (`app.core.territory_agenda_health`) : ce module ne fait que la mettre en
 * mots. Aucun seuil n'est recalculé ici, pour qu'une seule source décide.
 *
 * Extrait du composant afin d'être testable dans l'environnement `node` que
 * l'admin utilise déjà (`lib/**\/*.test.ts`), sans introduire de harnais de test
 * de composants.
 */
export type CockpitAgendaAlertView =
  | { visible: false }
  | {
      visible: true;
      severite: "critical" | "warning";
      titre: string;
      detail: string;
      actionLabel: string;
      actionHref: string;
    };

const ACTION_LABEL = "Gérer les événements";
const ACTION_HREF = "/events";

function pluriel(n: number): string {
  return n > 1 ? "s" : "";
}

export function buildCockpitAgendaAlert(
  agendaHealth: AdminCockpitAgendaHealth,
  city: string,
): CockpitAgendaAlertView {
  if (!agendaHealth.is_alerting) return { visible: false };

  const { upcoming_count: compte, threshold: seuil, status, label } = agendaHealth;
  const manquants = Math.max(seuil - compte, 0);

  const constat =
    compte === 0
      ? `Aucun événement à venir n'est publié pour ${city}.`
      : `${compte} événement${pluriel(compte)} à venir pour ${city}, sur ${seuil} attendus.`;

  const consigne =
    manquants > 0
      ? ` Publiez ${manquants} événement${pluriel(manquants)} de plus pour réactiver l'agenda.`
      : "";

  return {
    visible: true,
    severite: status === "critical" ? "critical" : "warning",
    titre: label,
    detail: `${constat}${consigne}`,
    actionLabel: ACTION_LABEL,
    actionHref: ACTION_HREF,
  };
}
