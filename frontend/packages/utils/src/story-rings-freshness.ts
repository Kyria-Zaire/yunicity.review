/**
 * Fraîcheur des anneaux Story — PR202-MOBILE-P0.
 *
 * Une Story publiée apparaissait dans `/stories` mais pas dans le rail
 * « Moments près de vous » de l'accueil, qui continuait d'afficher l'entrée
 * précédente. Les deux surfaces lisent pourtant le MÊME endpoint : ce n'est
 * donc pas une divergence de source, mais une question de moment de lecture.
 *
 * L'accueil ne charge ses anneaux qu'au montage de son contexte. Or revenir en
 * arrière depuis iOS Safari restaure typiquement la page depuis le bfcache,
 * sans réexécuter les effets : le rail reste alors tel qu'il était AVANT la
 * publication, indéfiniment.
 *
 * Plutôt que de parier sur les règles de remontage du routeur — qui varient
 * selon le navigateur, le cache et la façon exacte de revenir — on rend le
 * rafraîchissement explicite : publier marque les anneaux périmés, et
 * l'accueil recharge quand il redevient visible s'il a manqué une publication.
 *
 * Volontairement un compteur, pas un booléen : deux publications successives
 * doivent être distinguées d'une seule, y compris si l'accueil recharge entre
 * les deux. Et volontairement en mémoire seulement : il ne s'agit pas de
 * persister une donnée, mais de savoir si CETTE session a publié depuis sa
 * dernière lecture.
 */

let version = 0;
const abonnes = new Set<() => void>();

/** Signale qu'une publication rend les anneaux déjà chargés obsolètes. */
export function markStoryRingsStale(): void {
  version += 1;
  // Copie : un abonné qui se désabonne pendant la notification ne doit pas
  // faire sauter les suivants.
  for (const notifier of [...abonnes]) {
    notifier();
  }
}

/** Version courante. Une surface la compare à celle de son dernier chargement. */
export function storyRingsVersion(): number {
  return version;
}

/** S'abonne aux publications. Rend la fonction de désabonnement. */
export function subscribeStoryRings(notifier: () => void): () => void {
  abonnes.add(notifier);
  return () => {
    abonnes.delete(notifier);
  };
}

/** Remise à zéro entre deux tests : l'état est un module, pas un composant. */
export function __resetStoryRingsFreshnessForTests(): void {
  version = 0;
  abonnes.clear();
}
