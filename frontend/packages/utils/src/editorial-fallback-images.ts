import type { LocalEvent, Neighborhood, Tribe } from "@yunicity/types";

/** Images éditoriales Unsplash — carrousel « À la une » + cards moments (Reims demo). */

export const EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS =
  "https://images.unsplash.com/photo-1526547319484-63dce467060b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fENhZiVDMyVBOS1yZW5jb250cmUlMjBkZXMlMjBlbnRyZXByZW5ldXJzfGVufDB8fDB8fHww";

export const EDITORIAL_IMAGE_ATELIER_PHOTO_URBAIN =
  "https://plus.unsplash.com/premium_photo-1723741355484-0a0b4c6d355c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8QXRlbGllciUyMHBob3RvJTIwdXJiYWlufGVufDB8fDB8fHww";

export const EDITORIAL_IMAGE_CAFES_LECTURE =
  "https://images.unsplash.com/photo-1558210834-473f430c09ac?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Q2FmJUMzJUE5cyUyMCUyNiUyMGxlY3R1cmV8ZW58MHx8MHx8fDA%3D";

export const EDITORIAL_IMAGE_MUSIQUE_LOCALE =
  "https://images.unsplash.com/photo-1779200929467-2a7e3245833b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fE11c2lxdWUlMjBsb2NhbGV8ZW58MHx8MHx8fDA%3D";

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
};

const TRIBE_CATEGORY_EDITORIAL_IMAGES: Record<string, string> = {
  cafe_culture: EDITORIAL_IMAGE_CAFES_LECTURE,
  music: EDITORIAL_IMAGE_MUSIQUE_LOCALE,
};

/** Images éditoriales quartiers Reims — section « L’ambiance des quartiers ». */
export const NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE =
  "https://i2.wp.com/www.uncoupleenvadrouille.fr/wp-content/uploads/2019/08/Place-Drouet-dErlon-avec-monument-%C3%A0-reims.jpg?resize=1080%2C720";

export const NEIGHBORHOOD_EDITORIAL_IMAGE_SAINT_REMI =
  "https://th.bing.com/th/id/OIP.vzWR5ppH-ajb9lYAq0yy7wHaFj?w=312&h=200&c=10&o=6&pid=genserp&rm=2";

export const NEIGHBORHOOD_EDITORIAL_IMAGE_BOULINGRIN =
  "https://th.bing.com/th/id/OIP.F76XNrGOhzJU5lB9yt--uAHaEK?w=324&h=182&c=7&r=0&o=7&pid=1.7&rm=3";

export const NEIGHBORHOOD_EDITORIAL_IMAGE_CERNAY =
  "https://cernay-les-reims.fr/wp-content/uploads/2019/11/GOPR0795.jpg";

export const NEIGHBORHOOD_EDITORIAL_IMAGE_CLAIRMARAIS =
  "https://remeng.rosselcdn.net/sites/default/files/dpistyles_v2/ena_16_9_extra_big/2023/03/09/node_463568/13070745/public/2023/03/09/B9733679277Z.1_20230309170814_000%2BGQ7MC6H8Q.1-0.jpg?itok=nyiWOz2y1678381312";

export const NEIGHBORHOOD_EDITORIAL_IMAGE_CROIX_ROUGE =
  "https://media.lhebdoduvendredi.com/illustrations/00039997_normal.jpg";

const NEIGHBORHOOD_SLUG_EDITORIAL_IMAGES: Record<string, string> = {
  "centre-ville": NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE,
  "saint-remi": NEIGHBORHOOD_EDITORIAL_IMAGE_SAINT_REMI,
  boulingrin: NEIGHBORHOOD_EDITORIAL_IMAGE_BOULINGRIN,
  cernay: NEIGHBORHOOD_EDITORIAL_IMAGE_CERNAY,
  clairmarais: NEIGHBORHOOD_EDITORIAL_IMAGE_CLAIRMARAIS,
  "croix-rouge": NEIGHBORHOOD_EDITORIAL_IMAGE_CROIX_ROUGE,
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
  if (neighborhood.cover_image_url?.trim()) {
    return neighborhood.cover_image_url;
  }
  const slugKey = normalizeEditorialKey(neighborhood.slug);
  return NEIGHBORHOOD_SLUG_EDITORIAL_IMAGES[slugKey] ?? null;
}
