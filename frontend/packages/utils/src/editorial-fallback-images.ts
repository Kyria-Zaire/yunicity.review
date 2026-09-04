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

/** Images éditoriales quartiers Reims — Wikimedia Commons (lieux réels, pas de stock générique). */
function reimsCommonsImage(filePath: string, width = 1400): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${filePath}?width=${width}`;
}

/** Cathédrale Notre-Dame — Centre-ville. */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE = reimsCommonsImage(
  "Cathedral_of_Reims_%2817%29.jpg",
);

/** Basilique Saint-Remi. */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_SAINT_REMI = reimsCommonsImage(
  "Basilique_Saint-Remi_de_Reims_Exterior_1%2C_Reims%2C_France_-_Diliff.jpg",
);

/** Halles du Boulingrin. */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_BOULINGRIN = reimsCommonsImage(
  "Reims_-_halles_du_Boulingrin_(04).JPG",
);

/** Canal / Vesle — Clairmarais. */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_CLAIRMARAIS = reimsCommonsImage(
  "Reims_Pont_de_Vesle_sur_le_canal.jpg",
);

/** Épinettes / nord-est — Cernay. */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_CERNAY = reimsCommonsImage(
  "%C3%89pinettes_reims_1006433.jpg",
);

/** Angle Jaurès–Briand — Jean-Jaurès. */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_JEAN_JAURES = reimsCommonsImage(
  "Angle_Jaur%C3%A8s_Briand_01636.JPG",
);

/** Quartier fusionné Cernay – Jean-Jaurès (vie de rue nord-est). */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_CERNAY_JEAN_JAURES =
  NEIGHBORHOOD_EDITORIAL_IMAGE_JEAN_JAURES;

/** Quartier Croix-Rouge. */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_CROIX_ROUGE = reimsCommonsImage(
  "Quartier_Reims_Croix_Rouge.jpg",
);

/** Val Murigny. */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_MURIGNY = reimsCommonsImage("Val_murigny_1005095.jpg");

/** Gare Maison-Blanche. */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_MAISON_BLANCHE = reimsCommonsImage(
  "Gare_de_Reims-Maison-Blanche-2016.jpg",
);

/** Cité-jardin Chemin Vert. */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_CHEMIN_VERT = reimsCommonsImage(
  "Chemin_vert_1512068.jpg",
);

/** Maison de quartier Orgeval. */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_ORGEVAL = reimsCommonsImage(
  "Maison_de_quartier_orgeval_1406234.jpg",
);

/** Église Saint-Jean — La Neuvillette. */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_LA_NEUVILLETTE = reimsCommonsImage(
  "Reims_%C3%89glise_Saint-Jean_%28la_Neuvillette%29.jpg",
);

/** Porte de Paris — Courlancy. */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_COURLANCY = reimsCommonsImage(
  "Reims_-_porte_de_Paris_-_2023-06-04_-_11.jpg",
);

/** Parc des Châtillons. */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_CHATILLONS = reimsCommonsImage(
  "Parc_des_Chatillons_1549799.jpg",
);

/** Place d’Erlon / fontaine Subé — hero portail quartiers. */
export const NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL = reimsCommonsImage(
  "Reims_-_fontaine_Sub%C3%A9_-_2023-06-04_-_04.jpg",
);

/**
 * Photos Wikimedia par slug — tous les quartiers catalogue Reims.
 * Les covers CDN (SEED-PROD-01B) primeront via `cover_image_url` quand disponibles.
 */
const NEIGHBORHOOD_SLUG_EDITORIAL_IMAGES: Record<string, string> = {
  "centre-ville": NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE,
  "saint-remi": NEIGHBORHOOD_EDITORIAL_IMAGE_SAINT_REMI,
  boulingrin: NEIGHBORHOOD_EDITORIAL_IMAGE_BOULINGRIN,
  clairmarais: NEIGHBORHOOD_EDITORIAL_IMAGE_CLAIRMARAIS,
  cernay: NEIGHBORHOOD_EDITORIAL_IMAGE_CERNAY,
  "jean-jaures": NEIGHBORHOOD_EDITORIAL_IMAGE_JEAN_JAURES,
  "cernay-jean-jaures": NEIGHBORHOOD_EDITORIAL_IMAGE_CERNAY_JEAN_JAURES,
  "croix-rouge": NEIGHBORHOOD_EDITORIAL_IMAGE_CROIX_ROUGE,
  murigny: NEIGHBORHOOD_EDITORIAL_IMAGE_MURIGNY,
  "maison-blanche": NEIGHBORHOOD_EDITORIAL_IMAGE_MAISON_BLANCHE,
  "chemin-vert": NEIGHBORHOOD_EDITORIAL_IMAGE_CHEMIN_VERT,
  orgeval: NEIGHBORHOOD_EDITORIAL_IMAGE_ORGEVAL,
  "la-neuvillette": NEIGHBORHOOD_EDITORIAL_IMAGE_LA_NEUVILLETTE,
  courlancy: NEIGHBORHOOD_EDITORIAL_IMAGE_COURLANCY,
  chatillons: NEIGHBORHOOD_EDITORIAL_IMAGE_CHATILLONS,
};


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
