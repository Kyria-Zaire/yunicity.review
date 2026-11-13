import { TRIBE_CREATE_DESKTOP_CHECKLIST_NO_ERRORS } from "@yunicity/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type TribeCreateBlockingStatusProps = {
  /** Nombre d'erreurs bloquantes — `tribeCreateBlockingErrorCount(draft)`. */
  blockingErrors: number;
  /** Mise en page propre à l'emplacement (marges, `flex` / `inline-flex`). */
  className: string;
  iconClassName: string;
};

/**
 * TRIBE-CREATE-BLOCKING-STATUS-01 — statut de la checklist de création de tribu.
 *
 * Sans erreur : coche verte. Avec erreurs : icône d'alerte et texte rouge — la
 * coche verte annonçait à tort un état valide alors que des erreurs bloquaient.
 * Contrastes sur blanc (texte `text-xs`, seuil 4,5:1) : `emerald-700` 5,48:1,
 * `red-700` 6,47:1 (`emerald-600` n'atteignait que 3,77:1).
 * Partagé par le mobile et la checklist desktop / medium.
 */
export function TribeCreateBlockingStatus({ blockingErrors, className, iconClassName }: TribeCreateBlockingStatusProps) {
  if (blockingErrors === 0) {
    return (
      <p className={`${className} text-xs font-medium text-emerald-700`} data-tribe-create-blocking-status="valid">
        <CheckCircle2 className={iconClassName} aria-hidden />
        {TRIBE_CREATE_DESKTOP_CHECKLIST_NO_ERRORS}
      </p>
    );
  }

  const pluriel = blockingErrors > 1 ? "s" : "";
  return (
    <p className={`${className} text-xs font-medium text-red-700`} data-tribe-create-blocking-status="errors">
      <AlertCircle className={iconClassName} aria-hidden />
      {`${blockingErrors} erreur${pluriel} bloquante${pluriel}`}
    </p>
  );
}
