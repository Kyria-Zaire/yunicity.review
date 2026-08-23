"use client";

import { Dialog } from "@yunicity/ui/primitives";

/**
 * Visionneuse média du fil mobile (C3.1-R1L, habillage C3.1-R1L.1).
 *
 * Cliquer une image publiée ne produisait aucune action : l'image était un
 * `<img>` nu. La surface juste est un overlay — pas une page Média, pas le
 * lecteur Stories — et la primitive `Dialog` porte déjà, avec un contrat vérifié
 * en C3.1-R1E, tout ce que la revue exige : verrouillage du scroll d'arrière-plan,
 * piège à focus, fermeture par `Escape`, restauration du focus au déclencheur et
 * neutralisation de la bottom-nav par empilement.
 *
 * ── Habillage (R1L.1) ────────────────────────────────────────────────────────
 * Le premier jet réutilisait l'habillage `default` du Dialog : carte blanche
 * centrée, coins arrondis, en-tête titré, corps rembourré. Mesuré à l'ouverture :
 * panneau de 358 px sur un viewport de 390, 361 sur 393, et 512 sur 639 — le
 * plafond `max-w-[min(32rem,92vw)]` devenait visible dès 639. L'image agrandie
 * pouvait ainsi paraître PLUS PETITE que dans le fil, ce qui vide l'action de son
 * sens.
 *
 * D'où `chrome="bare"` : plein viewport, fond noir, aucune carte, aucun
 * rembourrage structurel, bouton de fermeture flottant dans la safe area. Le
 * titre reste rendu en `sr-only` — le nom accessible du dialogue est conservé,
 * seul son affichage disparaît, car ici c'est l'image qui est le sujet.
 *
 * `object-contain` garantit l'image entière, jamais recadrée ni déformée, en
 * paysage comme en portrait ; `max-h-[100dvh]` la contient dans le viewport.
 */
export function FeedMobileMediaViewer({
  open,
  onOpenChange,
  mediaUrl,
  label,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaUrl: string;
  /** Texte alternatif : le corps de la publication quand il existe. */
  label: string;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={label}
      closeLabel="Fermer l’image"
      chrome="bare"
      className="bg-black"
    >
      <div className="flex h-full w-full items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- média filesystem/R2, hors next/image */}
        <img
          src={mediaUrl}
          alt={label}
          className="max-h-[100dvh] max-w-full object-contain"
          decoding="async"
        />
      </div>
    </Dialog>
  );
}
