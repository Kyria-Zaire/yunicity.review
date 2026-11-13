import type { WebContentWidth } from "@/lib/layout/web-layout-config";
import { buildPartnerPortalOfferCreateHref } from "@yunicity/utils";

/**
 * Largeur de contenu de l'espace partenaire (PARTNER-OFFER-CREATE-DESKTOP-LAYOUT-01).
 *
 * Les pages de l'espace restent en `wide` (768 px). Seule la création d'offre en est
 * libérée : son écran desktop est dessiné en trois colonnes (étapes, formulaire,
 * aperçu) et sa propre coquille borne déjà la largeur (`max-w-[1440px]`) — en `wide`,
 * la colonne du formulaire tombait à 112 px.
 */
export function resolvePartnerPortalContentWidth(pathname: string | null): WebContentWidth {
  return pathname === buildPartnerPortalOfferCreateHref() ? "full" : "wide";
}
