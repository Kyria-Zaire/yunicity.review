import type { ReactNode } from "react";

/**
 * Grille desktop citoyenne : [sidebar | contenu principal | contexte optionnel].
 * Voir `globals.css` (.web-desktop-grid) pour les tokens de colonnes.
 */
export function WebDesktopLayout({
  sidebar,
  main,
  context,
}: {
  sidebar: ReactNode;
  main: ReactNode;
  context?: ReactNode;
}) {
  const gridClass = context
    ? "web-desktop-grid web-desktop-grid--with-context"
    : "web-desktop-grid";

  return (
    <div className={gridClass}>
      {sidebar}
      {main}
      {context ?? null}
    </div>
  );
}
