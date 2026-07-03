/** Liens légaux affichés sous le menu Créer — CREATORS-UX-02B. */

export const CREATE_HUB_LEGAL_PRIVACY_LABEL = "Confidentialité";
export const CREATE_HUB_LEGAL_TERMS_LABEL = "Conditions générales";
export const CREATE_HUB_LEGAL_FOOTER_ARIA_LABEL = "Informations légales";

export const CREATE_HUB_LEGAL_LINKS = [
  {
    href: "/legal/confidentialite",
    label: CREATE_HUB_LEGAL_PRIVACY_LABEL,
  },
  {
    href: "/legal/conditions-generales",
    label: CREATE_HUB_LEGAL_TERMS_LABEL,
  },
] as const;
