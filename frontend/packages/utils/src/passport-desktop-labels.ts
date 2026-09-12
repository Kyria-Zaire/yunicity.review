/** Passport desktop copy — maquette DESKTOP-PASSPORT-01. */

export const PASSPORT_DESKTOP_BREADCRUMB = (city: string) =>
  `${city.toUpperCase()} • PASSPORT`;

export const PASSPORT_DESKTOP_EDITORIAL_TITLE = "Votre ville vous réserve plus";
export const PASSPORT_DESKTOP_EDITORIAL_BODY =
  "Découvrez Reims, soutenez les acteurs locaux et profitez d'avantages réels.";
export const PASSPORT_DESKTOP_EDITORIAL_BANNER =
  "Progression et avantages calculés à partir de vos actions réelles.";
export const PASSPORT_DESKTOP_CITY_PICKER_LABEL = "Ville";
export const PASSPORT_DESKTOP_FLASH_BANNER_KICKER = "Annonce";
export const PASSPORT_DESKTOP_FLASH_BANNER_TITLE = (partnerName: string) =>
  `Offre flash chez ${partnerName}`;
export const PASSPORT_DESKTOP_FLASH_BANNER_CTA = "Voir l'offre";

export const PASSPORT_DESKTOP_NAV_PASSPORT = "Mon Passport";
export const PASSPORT_DESKTOP_NAV_OFFERS = "Offres";
export const PASSPORT_DESKTOP_NAV_PARTNERS = "Partenaires";
export const PASSPORT_DESKTOP_NAV_HISTORY = "Historique";
export const PASSPORT_DESKTOP_NAV_SAVED = "Offres enregistrées";

export const PASSPORT_DESKTOP_CATEGORIES_TITLE = "Catégories";
export const PASSPORT_DESKTOP_CATEGORY_FOOD = "Food";
export const PASSPORT_DESKTOP_CATEGORY_CULTURE = "Culture";
export const PASSPORT_DESKTOP_CATEGORY_WELLNESS = "Bien-être";
export const PASSPORT_DESKTOP_CATEGORY_SHOPS = "Commerces";
export const PASSPORT_DESKTOP_CATEGORY_LEISURE = "Loisirs";

export const PASSPORT_DESKTOP_UNDERSTAND_CTA = "Comprendre le Passport";

export const PASSPORT_DESKTOP_HERO_KICKER = (city: string) => `PASSPORT ${city.toUpperCase()}`;
export const PASSPORT_DESKTOP_HERO_LEVEL_PREFIX = "Niveau actuel";
export const PASSPORT_DESKTOP_HERO_PROGRESS_HINT =
  "Votre progression est mise à jour après une action validée.";
export const PASSPORT_DESKTOP_HERO_NEXT_LEVEL = "Prochain niveau";
export const PASSPORT_DESKTOP_HERO_SCAN_CTA = "Scanner un QR code";
export const PASSPORT_DESKTOP_HERO_HISTORY_CTA = "Voir mon historique";
export const PASSPORT_DESKTOP_HERO_SEGMENT_LABEL = (completed: number, total: number) =>
  `${completed} étapes sur ${total}`;

export const PASSPORT_DESKTOP_NEXT_STEPS_TITLE = "Vos prochaines étapes";
export const PASSPORT_DESKTOP_NEXT_STEP_TODO = "À faire";
export const PASSPORT_DESKTOP_NEXT_STEP_DONE = "Validé";

export const PASSPORT_DESKTOP_OFFERS_TAB_TITLE =
  "Des avantages locaux pour vivre Reims autrement";
export const PASSPORT_DESKTOP_OFFERS_TAB_BODY =
  "Découvrez les offres proposées par les partenaires Yunicity et utilisez-les avec votre Passport.";
export const PASSPORT_MOBILE_OFFERS_TAB_TITLE = "Vos avantages locaux";
export const PASSPORT_MOBILE_OFFERS_TAB_BODY =
  "Découvrez les offres des partenaires Yunicity.";
export const PASSPORT_MOBILE_OFFERS_FILTER_AVAILABLE = "Disponibles";
export const PASSPORT_MOBILE_OFFERS_FILTER_SAVED = "Enregistrées";
export const PASSPORT_MOBILE_OFFERS_ALL_TITLE = "Tous les avantages";
export const PASSPORT_DESKTOP_OFFERS_ELIGIBLE_SHORT = "Éligible";
export const PASSPORT_DESKTOP_OFFERS_SEARCH_PLACEHOLDER =
  "Rechercher une offre ou un partenaire...";
export const PASSPORT_DESKTOP_OFFERS_FILTER_AVAILABLE = "Disponibles maintenant";
export const PASSPORT_DESKTOP_OFFERS_FILTER_SAVED = "Offres enregistrées";
export const PASSPORT_DESKTOP_OFFERS_SORT_RECENT = "Les plus récentes";
export const PASSPORT_DESKTOP_OFFERS_FEATURED_TITLE = "À ne pas manquer";
export const PASSPORT_DESKTOP_OFFERS_ELIGIBLE = "Éligible avec votre Passport";
export const PASSPORT_DESKTOP_OFFERS_ALL_TITLE = "Toutes les offres";
export const PASSPORT_DESKTOP_OFFERS_ALL_SUBTITLE = (city: string) =>
  `Avantages proposés à ${city}`;
export const PASSPORT_DESKTOP_OFFERS_SHOW_MORE = "Afficher plus d'offres";
export const PASSPORT_DESKTOP_OFFERS_OPEN_PASSPORT = "Ouvrir mon Passport";
export const PASSPORT_DESKTOP_OFFERS_PASSPORT_ACTIVE = "Passport actif";
export const PASSPORT_DESKTOP_OFFERS_HOW_TITLE = "Comment utiliser une offre";
export const PASSPORT_DESKTOP_OFFERS_HOW_STEPS = [
  {
    title: "Ouvrez l'offre",
    body: "Sélectionnez l'offre de votre choix.",
  },
  {
    title: "Présentez votre QR",
    body: "Au partenaire au moment de l'utilisation.",
  },
  {
    title: "Le partenaire valide",
    body: "Il vérifie votre éligibilité et l'avantage.",
  },
] as const;
export const PASSPORT_DESKTOP_OFFERS_HOW_LOCK =
  "Le QR reste masqué jusqu'à votre action.";
export const PASSPORT_DESKTOP_OFFERS_CONDITIONS_TITLE = "Des conditions transparentes";
export const PASSPORT_DESKTOP_OFFERS_CONDITIONS_BODY =
  "Chaque avantage, période et règle provient du partenaire.";
export const PASSPORT_DESKTOP_OFFERS_CONDITIONS_CTA = "Consulter les règles";
export const PASSPORT_DESKTOP_OFFERS_PARTNER_TERMS = "Conditions fournies par le partenaire";
export const PASSPORT_DESKTOP_OFFERS_VIEW_ALL = "Voir toutes les offres";
export const PASSPORT_DESKTOP_OFFERS_TITLE = "Avantages à découvrir";
export const PASSPORT_DESKTOP_OFFERS_EMPTY =
  "Aucun avantage partenaire disponible pour le moment.";
export const PASSPORT_DESKTOP_OFFERS_AVAILABLE = "Disponible avec votre Passport";
export const PASSPORT_DESKTOP_OFFERS_AVAILABLE_UNTIL = (dateLabel: string, timeLabel: string) =>
  `Disponible jusqu'au ${dateLabel} · ${timeLabel}`;
export const PASSPORT_DESKTOP_OFFERS_CTA = "Voir l'offre";
export const PASSPORT_DESKTOP_OFFERS_FLASH = "OFFRE FLASH";
export const PASSPORT_DESKTOP_OFFERS_SAVE = "Enregistrer l'offre";

export const PASSPORT_OFFER_DETAIL_NAV_PASSPORT = "Passport";
export const PASSPORT_OFFER_DETAIL_NAV_OFFERS = "Offres";
export const PASSPORT_OFFER_DETAIL_MOBILE_TITLE = "Offre Passport";
export const PASSPORT_OFFER_DETAIL_BADGE = "OFFRE PASSPORT";
export const PASSPORT_OFFER_DETAIL_CONTEXT = (partnerName: string) =>
  `Une offre proposée par ${partnerName} aux détenteurs d'un Passport actif.`;
export const PASSPORT_OFFER_DETAIL_SAVE = "Enregistrer";
export const PASSPORT_OFFER_DETAIL_SAVED = "Enregistrée";
export const PASSPORT_OFFER_DETAIL_MAP = "Voir sur la carte";
export const PASSPORT_OFFER_DETAIL_ABOUT_TITLE = "À propos de l'offre";
export const PASSPORT_OFFER_DETAIL_PASSPORT_REQUIRED = "Passport actif requis";
export const PASSPORT_OFFER_DETAIL_HOW_TITLE = "Comment utiliser cette offre";
export const PASSPORT_OFFER_DETAIL_HOW_STEPS = (partnerName: string) =>
  [
    {
      title: "Ouvrez votre QR Passport",
      body: "Affichez-le uniquement au moment de l'utiliser.",
    },
    {
      title: `Présentez-le chez ${partnerName}`,
      body: "Le partenaire vérifie votre éligibilité.",
    },
    {
      title: "Faites valider l'avantage",
      body: "L'utilisation apparaît ensuite dans votre historique.",
    },
  ] as const;
export const PASSPORT_OFFER_DETAIL_CONDITIONS_TITLE = "Conditions de l'offre";
export const PASSPORT_OFFER_DETAIL_CONDITION_ACTIVE = "Passport Yunicity actif";
export const PASSPORT_OFFER_DETAIL_PARTNER_TITLE = "Le partenaire";
export const PASSPORT_OFFER_DETAIL_DISCOVER_PLACE = "Découvrir le lieu";
export const PASSPORT_OFFER_DETAIL_RELATED_TITLE = "D'autres avantages à découvrir";
export const PASSPORT_OFFER_DETAIL_YOUR_PASSPORT = "Votre Passport";
export const PASSPORT_OFFER_DETAIL_ELIGIBLE = "Vous êtes éligible";
export const PASSPORT_OFFER_DETAIL_SHOW_QR = "Afficher mon QR Passport";
export const PASSPORT_OFFER_DETAIL_QR_CAPTION =
  "Affichez votre QR uniquement devant le partenaire.";
export const PASSPORT_OFFER_DETAIL_QR_CAPTION_SHORT = "Uniquement devant le partenaire";
export const PASSPORT_OFFER_DETAIL_HISTORY = "Voir mon historique";
export const PASSPORT_OFFER_DETAIL_INFO_TITLE = "Informations pratiques";
export const PASSPORT_OFFER_DETAIL_INFO_PARTNER = "Partenaire";
export const PASSPORT_OFFER_DETAIL_INFO_CATEGORY = "Catégorie";
export const PASSPORT_OFFER_DETAIL_INFO_CITY = "Ville";
export const PASSPORT_OFFER_DETAIL_INFO_UNTIL = "Valable jusqu'au";
export const PASSPORT_OFFER_DETAIL_INFO_USAGE = "Utilisation";
export const PASSPORT_OFFER_DETAIL_USAGE_ON_SITE = "Sur place";
export const PASSPORT_OFFER_DETAIL_VALIDATION_TITLE = "Une validation transparente";
export const PASSPORT_OFFER_DETAIL_VALIDATION_BODY =
  "L'avantage est enregistré dans votre historique après validation du partenaire.";
export const PASSPORT_OFFER_DETAIL_VALIDATION_BODY_MOBILE =
  "L'avantage est enregistré seulement après validation par le partenaire.";
export const PASSPORT_OFFER_DETAIL_RULES = "Consulter les règles Passport";
export const PASSPORT_OFFER_DETAIL_NOT_FOUND = "Cette offre n'est plus disponible.";
export const PASSPORT_OFFER_DETAIL_BACK = "Retour aux offres";
export const PASSPORT_OFFER_DETAIL_DEFAULT_ABOUT = (partnerName: string) =>
  `Présentez votre Passport chez ${partnerName} pour bénéficier de cet avantage. L'éligibilité est vérifiée au moment de l'utilisation.`;

export const PASSPORT_DESKTOP_PARTNERS_TITLE = "Partenaires à découvrir";
export const PASSPORT_DESKTOP_PARTNERS_EMPTY =
  "Les partenaires locaux apparaîtront ici au fil du déploiement.";
export const PASSPORT_DESKTOP_PARTNERS_LOCATION = "Centre-ville";

export const PASSPORT_DESKTOP_HOW_TITLE = "Comment votre progression fonctionne";
export const PASSPORT_DESKTOP_HOW_FOOTER =
  "L'éligibilité et les niveaux dépendent uniquement de vos actions validées.";

export const PASSPORT_DESKTOP_QR_TITLE = "Mon QR Passport";
export const PASSPORT_DESKTOP_QR_EXPAND = "Afficher en grand";
export const PASSPORT_DESKTOP_QR_HINT =
  "Présentez ce code uniquement chez un partenaire Yunicity.";
export const PASSPORT_DESKTOP_QR_LOADING = "Chargement du QR…";
export const PASSPORT_DESKTOP_QR_ERROR = "QR indisponible pour le moment.";

export const PASSPORT_DESKTOP_PROGRESS_TITLE = "Prochaine étape";
export const PASSPORT_DESKTOP_PROGRESS_RATIO = (completed: number, total: number) =>
  `${completed} / ${total}`;
export const PASSPORT_DESKTOP_PROGRESS_REMAINING = (remaining: number) =>
  remaining <= 0
    ? "Prochain niveau accessible."
    : `Encore ${remaining} action${remaining > 1 ? "s" : ""} validée${remaining > 1 ? "s" : ""} pour atteindre le prochain niveau.`;
export const PASSPORT_DESKTOP_PROGRESS_CTA = "Voir les actions éligibles";

export const PASSPORT_DESKTOP_SAVED_TITLE = "Offres enregistrées";
export const PASSPORT_DESKTOP_SAVED_VIEW_ALL = "Tout afficher";
export const PASSPORT_DESKTOP_SAVED_EMPTY = "Enregistrez une offre pour la retrouver ici.";

export const PASSPORT_DESKTOP_ACTIVITY_TITLE = "Activité récente";
export const PASSPORT_DESKTOP_ACTIVITY_VIEW_ALL = "Voir l'historique";
export const PASSPORT_DESKTOP_ACTIVITY_EMPTY =
  "Vos actions validées apparaîtront ici.";

export const PASSPORT_DESKTOP_RULES_TITLE = "Des règles transparentes";
export const PASSPORT_DESKTOP_RULES_BODY =
  "Les niveaux, conditions et dates d'expiration viennent des données Passport et partenaires.";
export const PASSPORT_DESKTOP_RULES_CTA = "Consulter les règles";

export const PASSPORT_DESKTOP_HOW_STEPS = [
  {
    title: "Découvrez",
    body: "Explorez des lieux, des sorties et des partenaires Passport.",
  },
  {
    title: "Faites valider l'action",
    body: "Scannez votre QR Passport ou validez votre participation.",
  },
  {
    title: "Progressez",
    body: "Chaque action validée vous fait avancer vers le prochain niveau.",
  },
  {
    title: "Débloquez un avantage",
    body: "Atteignez les conditions requises pour accéder aux offres partenaires.",
  },
] as const;

export const PASSPORT_DESKTOP_NEXT_STEPS = [
  {
    id: "discover_place",
    title: "Découvrir un lieu partenaire",
    category: "Carte",
    href: "/map",
    tone: "blue",
  },
  {
    id: "join_event",
    title: "Participer à une sortie locale",
    category: "Sortir",
    href: "/sortir",
    tone: "green",
  },
  {
    id: "use_offer",
    title: "Utiliser un avantage Passport",
    category: "Offres",
    href: "#passport-desktop-offers",
    tone: "orange",
  },
] as const;
