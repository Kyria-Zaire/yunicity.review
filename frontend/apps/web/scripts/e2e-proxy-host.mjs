/**
 * Résolution de l'hôte d'écoute de la façade QA (C3-QA-SEC-01).
 *
 * ── Pourquoi ce module existe ────────────────────────────────────────────────
 * Le défaut historique était `0.0.0.0` : toute relance de la façade sans
 * `E2E_PROXY_HOST` publiait le Feed QA authentifié sur toutes les interfaces.
 * C'est arrivé le 22/08/2026 depuis un Wi-Fi public. Un défaut dangereux ne se
 * corrige pas par la discipline d'appel : il se corrige à la source.
 *
 * ── Contrat ──────────────────────────────────────────────────────────────────
 * Absence, chaîne vide ou blanche  → loopback. Jamais de repli public.
 * Valeur explicite non vide        → conservée telle quelle (une revue LAN
 *                                    autorisée reste possible, mais elle doit
 *                                    être DÉCIDÉE, jamais devinée).
 *
 * Fonction pure et sans dépendance : testable sans ouvrir de socket.
 */

export const LOOPBACK_HOST = "127.0.0.1";

/**
 * @param {Record<string, string | undefined>} [environment] variables d'environnement
 * @returns {string} hôte d'écoute
 */
export function resolveProxyHost(environment = process.env) {
  const brut = environment?.E2E_PROXY_HOST;
  if (typeof brut !== "string") return LOOPBACK_HOST;
  const valeur = brut.trim();
  return valeur === "" ? LOOPBACK_HOST : valeur;
}
