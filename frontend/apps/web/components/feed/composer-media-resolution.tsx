"use client";

import {
  COMPOSER_MEDIA_CHOOSE_ANOTHER,
  COMPOSER_MEDIA_CONTINUE_WITHOUT,
  COMPOSER_MEDIA_RESOLUTION_HINT,
} from "@yunicity/utils";

/**
 * Arbitrage d'un média refusé — MEDIA-01.
 *
 * Quand un fichier est rejeté (format, taille, envoi échoué), publier sans rien
 * dire reviendrait à retirer le média dans le dos de l'utilisateur : il clique
 * « Publier » en croyant l'envoyer. Tant qu'il n'a pas tranché, la publication
 * reste bloquée, et ces deux actions sont les seules issues.
 *
 * Aucune des deux n'envoie ni ne publie quoi que ce soit : elles ne font
 * qu'exprimer une intention.
 *
 * **Les libellés sont paramétrables parce qu'ils doivent rester vrais.** Sur un
 * composer mono-image, abandonner le fichier refusé revient à publier sans
 * image. Sur le parcours multi-médias, des médias valides peuvent rester
 * attachés : annoncer « Continuer sans image » y serait faux, puisque ces
 * médias-là partent bien. Les valeurs par défaut couvrent le cas mono-image.
 */
export function ComposerMediaResolution({
  onChooseAnother,
  onContinueWithout,
  chooseLabel = COMPOSER_MEDIA_CHOOSE_ANOTHER,
  continueLabel = COMPOSER_MEDIA_CONTINUE_WITHOUT,
  hint = COMPOSER_MEDIA_RESOLUTION_HINT,
  className = "",
}: {
  onChooseAnother: () => void;
  onContinueWithout: () => void;
  chooseLabel?: string;
  continueLabel?: string;
  hint?: string;
  className?: string;
}) {
  const bouton =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary";

  return (
    <div data-composer-media-resolution="" className={`mt-2 ${className}`}>
      <p className="text-xs leading-relaxed text-neutral-600">{hint}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={onChooseAnother} className={bouton}>
          {chooseLabel}
        </button>
        <button type="button" onClick={onContinueWithout} className={bouton}>
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
