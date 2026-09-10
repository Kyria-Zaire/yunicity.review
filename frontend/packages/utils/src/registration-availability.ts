/**
 * Ouverture des inscriptions — REGISTRATION-CONTAINMENT-01.
 *
 * Ce drapeau ne PROTEGE rien : la seule barriere est backend, qui refuse
 * `POST /api/v1/auth/register` avec un 403 `REGISTRATION_CLOSED`. Il sert
 * uniquement a dire la verite a l'ecran plutot que de laisser quelqu'un
 * remplir quatre etapes d'assistant pour se heurter a un refus a la fin.
 *
 * Ouvert par defaut, deliberement. Les deux dérives possibles ne se valent
 * pas :
 *   • front ouvert / backend ferme  -> l'inscription est refusee, l'utilisateur
 *     voit le message du backend. Genant, jamais dangereux.
 *   • front ferme / backend ouvert  -> l'endpoint reste ouvert, mais plus
 *     personne ne s'inscrit par l'interface.
 * Aucune des deux ne cree de compte non voulu. Fermer par defaut, en revanche,
 * couperait l'inscription en developpement local et sur tout environnement qui
 * ne declare pas la variable — un effet de bord bien pire que le defaut inverse.
 */

/** Seule une valeur explicitement fausse ferme l'affichage. */
export function resolveRegistrationEnabled(raw: string | undefined | null): boolean {
  const valeur = raw?.trim().toLowerCase();
  if (!valeur) return true;
  return !["false", "0", "no", "off"].includes(valeur);
}

export function isRegistrationEnabled(): boolean {
  return resolveRegistrationEnabled(
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_REGISTRATION_ENABLED : undefined,
  );
}
