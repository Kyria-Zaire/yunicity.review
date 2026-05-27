import type { CulturalPlaceListItem } from "@yunicity/types";

const CULTURAL_IMAGE_OVERRIDES: Record<string, string> = {
  "porte-de-mars":
    "https://th.bing.com/th/id/OIP.gQdEGwtjmHxBpBuiRqxHTAHaEI?w=310&h=180&c=7&r=0&o=7&pid=1.7&rm=3",
  "basilique-saint-remi":
    "https://www.actualitix.com/wp-content/uploads/2016/11/basilique-saint-remi-a-reims.jpg",
  "palais-du-tau":
    "https://img-4.linternaute.com/uQ_yW33guQHqdZTQdtIaFMhcK2Y=/1240x/smart/f4cad198146d41eb91fb8a9859ce5adc/ccmcms-linternaute/18659868.jpg",
  "cathedrale-notre-dame":
    "https://cdn.elebase.io/173fe953-8a63-4a8a-8ca3-1bacb56d78a5/a016fa00-8eec-4399-bcb8-10f91b9acfd5-shutterstock_200545976.jpg?q=90",
};

export function resolveCulturalPlaceImageOverride(place: Pick<CulturalPlaceListItem, "slug">): string | null {
  return CULTURAL_IMAGE_OVERRIDES[place.slug] ?? null;
}
