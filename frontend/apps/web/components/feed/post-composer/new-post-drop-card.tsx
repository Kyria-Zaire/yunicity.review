"use client";

import { useState, type DragEvent, type ReactNode } from "react";

/** Le glisser concerne-t-il des fichiers (et pas un texte sélectionné) ? */
function porteDesFichiers(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes("Files");
}

/**
 * Carte du composeur (planches : carte blanche sur fond de page neutre) et
 * zone de dépôt de fichiers.
 *
 * Le dépôt passe par `onFiles` = `addFiles` du brouillon : les MÊMES
 * contrôles que le sélecteur (type, taille, plafond, refus nommés). Il n'est
 * qu'un raccourci — le bouton « Ajouter des photos ou vidéos » reste la voie
 * accessible au clavier. Inerte pendant un envoi : le lot y est figé.
 */
export function NewPostDropCard({
  disabled,
  onFiles,
  children,
}: {
  disabled: boolean;
  onFiles: (files: FileList | null) => void;
  children: ReactNode;
}) {
  const [survol, setSurvol] = useState(false);

  function surSurvol(event: DragEvent<HTMLElement>) {
    if (disabled || !porteDesFichiers(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    if (!survol) setSurvol(true);
  }

  function surSortie(event: DragEvent<HTMLElement>) {
    // Ignorer les sorties vers un enfant de la carte.
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setSurvol(false);
  }

  function surDepot(event: DragEvent<HTMLElement>) {
    if (disabled || !porteDesFichiers(event)) return;
    event.preventDefault();
    setSurvol(false);
    onFiles(event.dataTransfer.files);
  }

  return (
    <div
      onDragOver={surSurvol}
      onDragLeave={surSortie}
      onDrop={surDepot}
      className={`rounded-3xl border bg-white pb-4 shadow-sm transition-colors ${
        survol ? "border-yunicity-primary ring-2 ring-yunicity-primary/30" : "border-neutral-200"
      }`}
    >
      {children}
    </div>
  );
}
