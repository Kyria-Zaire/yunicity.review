import { HELP_CENTER_CATEGORIES } from "@/lib/help/help-center-contract";
import { LEGAL_ROUTES } from "@/lib/legal/legal-document-contract";

/**
 * Destinations des liens d'aide de la surface Tribus (TRIBE-HELP-LINK-404-01).
 *
 * Les cinq liens visaient `/help/tribes`, route qui n'a jamais existé : 404 au
 * préchargement comme au clic, aux trois formats. Chaque libellé reçoit ici une
 * destination EXISTANTE qui tient sa promesse — décision de Kyria (option B,
 * 2026-11-11) :
 *
 * - « Guide des tribus » → le centre d'aide, sur la catégorie « Tribus » (ancre
 *   FAQ « Comment rejoindre ou quitter une tribu ? »). L'ancre est lue dans le
 *   contrat du centre d'aide : si elle change là-bas, ce lien suit.
 * - « Découvrir les règles de communauté » → les CGU, qui portent la section
 *   « Règles de conduite ». Sans ancre : la page rend une ancre différente par
 *   format (`d-`, `md-`, `m-conduite`), aucune ne vaut pour les trois.
 *
 * Aucune seconde source de chemin : `/aide` et les CGU viennent de `LEGAL_ROUTES`.
 */
const tribesHelpCategoryAnchor =
  HELP_CENTER_CATEGORIES.find((category) => category.id === "tribes")?.href ?? "";

export const TRIBES_HELP_GUIDE_HREF = `${LEGAL_ROUTES.help}${tribesHelpCategoryAnchor}`;

export const TRIBES_COMMUNITY_RULES_HREF = LEGAL_ROUTES.terms;
