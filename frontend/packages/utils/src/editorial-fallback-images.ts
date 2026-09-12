import type { LocalEvent, Neighborhood, Tribe } from "@yunicity/types";

import { isPendingYunicityHostedCoverUrl } from "./map-media-url";

/** Images éditoriales Unsplash — carrousel « À la une » + cards moments (Reims demo). */

export const EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS =
  "https://images.unsplash.com/photo-1526547319484-63dce467060b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fENhZiVDMyVBOS1yZW5jb250cmUlMjBkZXMlMjBlbnRyZXByZW5ldXJzfGVufDB8fDB8fHww";

export const EDITORIAL_IMAGE_ATELIER_PHOTO_URBAIN =
  "https://plus.unsplash.com/premium_photo-1723741355484-0a0b4c6d355c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8QXRlbGllciUyMHBob3RvJTIwdXJiYWlufGVufDB8fDB8fHww";

export const EDITORIAL_IMAGE_CAFES_LECTURE =
  "https://images.unsplash.com/photo-1558210834-473f430c09ac?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Q2FmJUMzJUE5cyUyMCUyNiUyMGxlY3R1cmV8ZW58MHx8MHx8fDA%3D";

export const EDITORIAL_IMAGE_MUSIQUE_LOCALE =
  "https://images.unsplash.com/photo-1779200929467-2a7e3245833b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fE11c2lxdWUlMjBsb2NhbGV8ZW58MHx8MHx8fDA%3D";

export const EDITORIAL_IMAGE_PHOTOGRAPHES_URBAINS =
  "https://media.istockphoto.com/id/891567000/photo/pedestrian-street-illuminated-by-numerous-christmas-decoration-in-the-city-center-of-niort.jpg?s=612x612&w=0&k=20&c=I_8biv-6CEOaGinm0VV-AEQ55iln30m0jHtcNXl0cc0=";

export const EDITORIAL_IMAGE_RUNNING_REIMS =
  "https://images.unsplash.com/photo-1590333748338-d629e4564ad9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8UnVubmluZyUyMFJlaW1zfGVufDB8fDB8fHww";

const EVENT_TYPE_EDITORIAL_IMAGES: Record<string, string> = {
  meetup: EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  workshop: EDITORIAL_IMAGE_ATELIER_PHOTO_URBAIN,
};

const EVENT_TITLE_EDITORIAL_IMAGES: Record<string, string> = {
  "cafe-rencontre des entrepreneurs": EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  "atelier photo urbain": EDITORIAL_IMAGE_ATELIER_PHOTO_URBAIN,
};

const TRIBE_SLUG_EDITORIAL_IMAGES: Record<string, string> = {
  "cafes-lecture": EDITORIAL_IMAGE_CAFES_LECTURE,
  "musique-locale": EDITORIAL_IMAGE_MUSIQUE_LOCALE,
  "photographes-urbains": EDITORIAL_IMAGE_PHOTOGRAPHES_URBAINS,
  "running-reims": EDITORIAL_IMAGE_RUNNING_REIMS,
};

const TRIBE_CATEGORY_EDITORIAL_IMAGES: Record<string, string> = {
  cafe_culture: EDITORIAL_IMAGE_CAFES_LECTURE,
  music: EDITORIAL_IMAGE_MUSIQUE_LOCALE,
  photography: EDITORIAL_IMAGE_PHOTOGRAPHES_URBAINS,
  sport_local: EDITORIAL_IMAGE_RUNNING_REIMS,
};

/**
 * Images éditoriales quartiers Reims — Wikimedia Commons (lieux réels, pas de stock générique).
 *
 * Ces fichiers sont sous licence CC BY-SA, qui EXIGE de créditer l'auteur, de nommer la licence
 * et de renvoyer vers la source. Le registre porte donc l'URL *et* son attribution dans la même
 * entrée : aucune image ne peut être référencée sans ses métadonnées. Rendu par
 * `CulturalImageCredit`. Le crédit ne s'affiche que si l'image de repli est réellement rendue —
 * un cover propre au quartier garde son propre crédit (voir `resolveNeighborhoodEditorialImageCredit`).
 */
export type EditorialImageCredit = {
  /** URL de rendu (`Special:FilePath` redimensionné). */
  url: string;
  /** Nom du fichier sur Commons — identité de la ressource, et clé d'unicité. */
  commonsFile: string;
  author: string;
  license: string;
  /** Page licence Creative Commons exacte (CC BY-SA 3.0 / 4.0). */
  licenseUrl: string;
  /** Page `File:` — le lien vers la source exigé par CC BY-SA. */
  sourceUrl: string;
};

/** URL canonique de la licence Creative Commons correspondante. */
export function resolveCreativeCommonsLicenseUrl(license: string): string {
  const normalized = license.trim().toUpperCase();
  if (normalized === "CC BY-SA 3.0") {
    return "https://creativecommons.org/licenses/by-sa/3.0/";
  }
  if (normalized === "CC BY-SA 4.0") {
    return "https://creativecommons.org/licenses/by-sa/4.0/";
  }
  const version = license.match(/(\d\.\d)/)?.[1];
  if (version) {
    return `https://creativecommons.org/licenses/by-sa/${version}/`;
  }
  return "https://creativecommons.org/licenses/";
}

function reimsCommonsImage(filePath: string, width = 1400): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${filePath}?width=${width}`;
}

function reimsCommonsEntry(
  filePath: string,
  author: string,
  license: string,
): EditorialImageCredit {
  return {
    url: reimsCommonsImage(filePath),
    // Titre Commons canonique : les underscores d'URL valent des espaces. Même forme que
    // `commons_file` dans media_manifest_reims.json (SEED-PROD-01B).
    commonsFile: decodeURIComponent(filePath).replace(/_/g, " "),
    author,
    license,
    licenseUrl: resolveCreativeCommonsLicenseUrl(license),
    sourceUrl: `https://commons.wikimedia.org/wiki/File:${filePath}`,
  };
}

/**
 * Un secteur = une photo. Auteur et licence relevés sur la page `File:` de chaque fichier.
 * `croix-rouge` : l'ancienne entrée `Quartier_Reims_Croix_Rouge.jpg` était une CARTE schématique
 * (668×768) servie comme hero photographique — remplacée par une vraie vue du quartier.
 */
const NEIGHBORHOOD_EDITORIAL_ENTRIES = {
  /** Cathédrale Notre-Dame — Centre-ville. */
  "centre-ville": reimsCommonsEntry("Cathedral_of_Reims_%2817%29.jpg", "Tournasol7", "CC BY-SA 4.0"),
  /** Basilique Saint-Remi. */
  "saint-remi": reimsCommonsEntry(
    "Basilique_Saint-Remi_de_Reims_Exterior_1%2C_Reims%2C_France_-_Diliff.jpg",
    "Diliff",
    "CC BY-SA 3.0",
  ),
  /** Halles du Boulingrin. */
  boulingrin: reimsCommonsEntry(
    "Reims_-_halles_du_Boulingrin_(04).JPG",
    "Fab5669",
    "CC BY-SA 3.0",
  ),
  /** Canal / Vesle — Clairmarais. */
  clairmarais: reimsCommonsEntry(
    "Reims_Pont_de_Vesle_sur_le_canal.jpg",
    "Ours51+",
    "CC BY-SA 4.0",
  ),
  /** Épinettes / nord-est — Cernay. */
  cernay: reimsCommonsEntry("%C3%89pinettes_reims_1006433.jpg", "G.Garitan", "CC BY-SA 4.0"),
  /** Angle Jaurès–Briand — Jean-Jaurès. */
  "jean-jaures": reimsCommonsEntry(
    "Angle_Jaur%C3%A8s_Briand_01636.JPG",
    "G.Garitan",
    "CC BY-SA 4.0",
  ),
  /** Passerelle et tours devant la faculté, depuis le parc Saint-John Perse — Croix-Rouge. */
  "croix-rouge": reimsCommonsEntry("Croix_Rouge_passerelle.jpg", "G.Garitan", "CC BY-SA 3.0"),
  /** Val Murigny. */
  murigny: reimsCommonsEntry("Val_murigny_1005095.jpg", "G.Garitan", "CC BY-SA 4.0"),
  /** Gare Maison-Blanche. */
  "maison-blanche": reimsCommonsEntry(
    "Gare_de_Reims-Maison-Blanche-2016.jpg",
    "AirScott",
    "CC BY-SA 4.0",
  ),
  /** Cité-jardin Chemin Vert. */
  "chemin-vert": reimsCommonsEntry("Chemin_vert_1512068.jpg", "G.Garitan", "CC BY-SA 4.0"),
  /** Maison de quartier Orgeval. */
  orgeval: reimsCommonsEntry(
    "Maison_de_quartier_orgeval_1406234.jpg",
    "G.Garitan",
    "CC BY-SA 4.0",
  ),
  /** Église Saint-Jean — La Neuvillette. */
  "la-neuvillette": reimsCommonsEntry(
    "Reims_%C3%89glise_Saint-Jean_%28la_Neuvillette%29.jpg",
    "Aimelaime",
    "CC BY-SA 4.0",
  ),
  /** Porte de Paris — Courlancy. */
  courlancy: reimsCommonsEntry(
    "Reims_-_porte_de_Paris_-_2023-06-04_-_11.jpg",
    "Mathieu Kappler",
    "CC BY-SA 4.0",
  ),
  /** Tour des Argonautes — Châtillons (vue nocturne du quartier). */
  chatillons: reimsCommonsEntry(
    "La_tour_des_argonautes_Reims_08864.JPG",
    "G. Garitan",
    "CC BY-SA 4.0",
  ),
} as const satisfies Record<string, EditorialImageCredit>;

/** Place d’Erlon / fontaine Subé — hero portail quartiers. */
export const NEIGHBORHOODS_PORTAL_HERO_CREDIT = reimsCommonsEntry(
  "Reims_-_fontaine_Sub%C3%A9_-_2023-06-04_-_04.jpg",
  "Mathieu Kappler",
  "CC BY-SA 4.0",
);
export const NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL = NEIGHBORHOODS_PORTAL_HERO_CREDIT.url;

// Exports historiques en `string` — contrat inchangé pour les consommateurs existants.
export const NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE =
  NEIGHBORHOOD_EDITORIAL_ENTRIES["centre-ville"].url;
export const NEIGHBORHOOD_EDITORIAL_IMAGE_SAINT_REMI =
  NEIGHBORHOOD_EDITORIAL_ENTRIES["saint-remi"].url;
export const NEIGHBORHOOD_EDITORIAL_IMAGE_BOULINGRIN =
  NEIGHBORHOOD_EDITORIAL_ENTRIES.boulingrin.url;
export const NEIGHBORHOOD_EDITORIAL_IMAGE_CLAIRMARAIS =
  NEIGHBORHOOD_EDITORIAL_ENTRIES.clairmarais.url;
export const NEIGHBORHOOD_EDITORIAL_IMAGE_CERNAY = NEIGHBORHOOD_EDITORIAL_ENTRIES.cernay.url;
export const NEIGHBORHOOD_EDITORIAL_IMAGE_JEAN_JAURES =
  NEIGHBORHOOD_EDITORIAL_ENTRIES["jean-jaures"].url;
/** Quartier fusionné Cernay – Jean-Jaurès : réutilise la vie de rue nord-est de Jean-Jaurès. */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_CERNAY_JEAN_JAURES =
  NEIGHBORHOOD_EDITORIAL_IMAGE_JEAN_JAURES;
export const NEIGHBORHOOD_EDITORIAL_IMAGE_CROIX_ROUGE =
  NEIGHBORHOOD_EDITORIAL_ENTRIES["croix-rouge"].url;
export const NEIGHBORHOOD_EDITORIAL_IMAGE_MURIGNY = NEIGHBORHOOD_EDITORIAL_ENTRIES.murigny.url;
export const NEIGHBORHOOD_EDITORIAL_IMAGE_MAISON_BLANCHE =
  NEIGHBORHOOD_EDITORIAL_ENTRIES["maison-blanche"].url;
export const NEIGHBORHOOD_EDITORIAL_IMAGE_CHEMIN_VERT =
  NEIGHBORHOOD_EDITORIAL_ENTRIES["chemin-vert"].url;
export const NEIGHBORHOOD_EDITORIAL_IMAGE_ORGEVAL = NEIGHBORHOOD_EDITORIAL_ENTRIES.orgeval.url;
export const NEIGHBORHOOD_EDITORIAL_IMAGE_LA_NEUVILLETTE =
  NEIGHBORHOOD_EDITORIAL_ENTRIES["la-neuvillette"].url;
export const NEIGHBORHOOD_EDITORIAL_IMAGE_COURLANCY =
  NEIGHBORHOOD_EDITORIAL_ENTRIES.courlancy.url;
export const NEIGHBORHOOD_EDITORIAL_IMAGE_CHATILLONS =
  NEIGHBORHOOD_EDITORIAL_ENTRIES.chatillons.url;

/**
 * Entrées par slug — tous les quartiers catalogue Reims.
 * Les covers CDN (SEED-PROD-01B) primeront via `cover_image_url` quand disponibles.
 */
const NEIGHBORHOOD_SLUG_EDITORIAL_ENTRIES: Record<string, EditorialImageCredit> = {
  ...NEIGHBORHOOD_EDITORIAL_ENTRIES,
  "cernay-jean-jaures": NEIGHBORHOOD_EDITORIAL_ENTRIES["jean-jaures"],
};

const NEIGHBORHOOD_SLUG_EDITORIAL_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(NEIGHBORHOOD_SLUG_EDITORIAL_ENTRIES).map(([slug, entry]) => [slug, entry.url]),
);


function normalizeEditorialKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function resolveEventEditorialImage(event: LocalEvent): string | null {
  const titleKey = normalizeEditorialKey(event.title);
  const byTitle = EVENT_TITLE_EDITORIAL_IMAGES[titleKey];
  if (byTitle) {
    return byTitle;
  }

  const type = event.event_type?.trim().toLowerCase();
  if (type && EVENT_TYPE_EDITORIAL_IMAGES[type]) {
    return EVENT_TYPE_EDITORIAL_IMAGES[type]!;
  }

  return null;
}

export function resolveTribeEditorialImage(tribe: Tribe): string | null {
  const slugKey = normalizeEditorialKey(tribe.slug);
  const bySlug = TRIBE_SLUG_EDITORIAL_IMAGES[slugKey];
  if (bySlug) {
    return bySlug;
  }

  const categoryKey = tribe.category?.trim().toLowerCase();
  if (categoryKey && TRIBE_CATEGORY_EDITORIAL_IMAGES[categoryKey]) {
    return TRIBE_CATEGORY_EDITORIAL_IMAGES[categoryKey]!;
  }

  return null;
}

export function resolveNeighborhoodEditorialImage(
  neighborhood: Pick<Neighborhood, "slug" | "cover_image_url">,
): string | null {
  const cover = neighborhood.cover_image_url?.trim();
  if (cover && !isPendingYunicityHostedCoverUrl(cover)) {
    return cover;
  }
  const slugKey = normalizeEditorialKey(neighborhood.slug);
  return NEIGHBORHOOD_SLUG_EDITORIAL_IMAGES[slugKey] ?? null;
}

/**
 * Crédit de l'image de repli — UNIQUEMENT quand c'est bien elle qui est rendue.
 *
 * La branche est la MÊME que `resolveNeighborhoodEditorialImage` : dès qu'un cover propre au
 * quartier est retenu, on renvoie `null` plutôt que le crédit Wikimedia, sinon on afficherait
 * l'attribution d'une autre photo que celle à l'écran. Le crédit d'un cover base/landmark reste
 * porté par `resolveNeighborhoodV2HeroImageCredit`.
 */
export function resolveNeighborhoodEditorialImageCredit(
  neighborhood: Pick<Neighborhood, "slug" | "cover_image_url">,
): EditorialImageCredit | null {
  const cover = neighborhood.cover_image_url?.trim();
  if (cover && !isPendingYunicityHostedCoverUrl(cover)) {
    return null;
  }
  const slugKey = normalizeEditorialKey(neighborhood.slug);
  return NEIGHBORHOOD_SLUG_EDITORIAL_ENTRIES[slugKey] ?? null;
}

/** Attribution CC BY-SA en une ligne : auteur, licence, plateforme. Le lien est porté à part. */
export function formatEditorialImageAttribution(credit: EditorialImageCredit): string {
  return `${credit.author} / ${credit.license} via Wikimedia Commons`;
}
