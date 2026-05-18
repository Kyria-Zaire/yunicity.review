import type { OrganizationType, VerificationStatus } from "@yunicity/types";

export const PROFILE_INTERESTS = [
  "food",
  "sports",
  "tech",
  "nightlife",
  "business",
  "gaming",
  "culture",
  "fitness",
  "music",
  "art",
  "entrepreneurship",
] as const;

export const INTEREST_LABELS: Record<string, string> = {
  food: "Gastronomie",
  sports: "Sport",
  tech: "Tech",
  nightlife: "Nightlife",
  business: "Business",
  gaming: "Gaming",
  culture: "Culture",
  fitness: "Fitness",
  music: "Musique",
  art: "Art",
  entrepreneurship: "Entrepreneuriat",
};

export const ORGANIZATION_TYPE_OPTIONS: { value: OrganizationType; label: string }[] = [
  { value: "commerce", label: "Commerce" },
  { value: "association", label: "Association" },
  { value: "school", label: "École" },
  { value: "freelance", label: "Indépendant" },
  { value: "public_agency", label: "Service public" },
  { value: "creator", label: "Créateur" },
  { value: "other", label: "Autre" },
];

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: "En attente",
  under_review: "En revue",
  verified: "Vérifiée",
  rejected: "Refusée",
  suspended: "Suspendue",
};

export const VISIBILITY_OPTIONS = [
  { value: "public" as const, label: "Public", hint: "Visible par la communauté" },
  { value: "city_only" as const, label: "Ma ville", hint: "Visible aux membres de ta ville" },
  { value: "private" as const, label: "Privé", hint: "Seulement toi" },
];
