import {
  WEB_CONTENT_WIDTH_CLASS,
  type WebContentWidth,
} from "@/lib/layout/web-layout-config";
import type { ReactNode } from "react";

/**
 * Colonne de contenu principale — limite la largeur de lecture / formulaires.
 * Utiliser `full` pour cartes hero (Passport) ou futures cartes pleine colonne.
 */
export function WebContentColumn({
  children,
  width = "readable",
  className = "",
}: {
  children: ReactNode;
  width?: WebContentWidth;
  className?: string;
}) {
  const widthClass = WEB_CONTENT_WIDTH_CLASS[width];
  return <section className={`${widthClass} ${className}`.trim()}>{children}</section>;
}
