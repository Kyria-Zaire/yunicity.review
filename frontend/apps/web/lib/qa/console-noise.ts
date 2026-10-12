/**
 * Classement des messages de console observés pendant un montage de harnais E2E.
 *
 * Le harnais de la carte de publication unifiée s'injecte dans une page servie
 * par l'application, afin de charger le CSS réel. Il hérite donc du bruit de
 * cette page hôte, qui n'a rien à voir avec ce qu'il prouve. Le contrat porte
 * sur les erreurs REACT du harnais : c'est ce tri qui est codé ici.
 *
 * Il vit dans `lib/` et non dans `e2e/` parce que c'est de la logique PURE, et
 * parce que le runner unitaire ne couvre que `lib/` — un prédicat de sécurité
 * qui ne serait pas testable ne vaudrait pas mieux qu'un filtre au hasard.
 */

/**
 * Notice CSP de la page hôte, émise par WebKit et pas par Chromium.
 *
 * Le motif est ANCRÉ sur le début du message. C'est ce qui le sépare d'un refus
 * bloquant, lequel commence par « Refused to … » tout en mentionnant lui aussi
 * la Content Security Policy. Un motif non ancré — une simple recherche de
 * « Content Security Policy » — masquerait les deux.
 */
const NOTICE_CSP_PAGE_HOTE = /^the content security policy\b/i;

/** Bruit réseau de la page hôte : elle sonde sa session et journalise ses 401/404. */
const BRUIT_RESEAU_PAGE_HOTE = /failed to load resource/i;

/**
 * `true` si ce message appartient à la page hôte et doit être ignoré.
 *
 * Tout le reste est conservé, y compris les refus d'exécution CSP et les
 * erreurs React.
 */
export function estBruitDePageHote(texte: string): boolean {
  const normalise = texte.trim();
  if (BRUIT_RESEAU_PAGE_HOTE.test(normalise)) return true;
  if (NOTICE_CSP_PAGE_HOTE.test(normalise)) return true;
  return false;
}
