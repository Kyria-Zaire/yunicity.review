import type { ReactNode } from "react";

/**
 * Conteneur racine du shell : pleine largeur viewport, padding cohérent,
 * plafond max-w-7xl pour les très grands écrans.
 */
export function WebResponsiveContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[var(--web-shell-max)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {children}
    </div>
  );
}
