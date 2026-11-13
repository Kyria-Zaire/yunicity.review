import {
  EVENT_CREATE_CATEGORY_CULTURE,
  EVENT_CREATE_CATEGORY_FAMILY,
  EVENT_CREATE_CATEGORY_FOOD,
  EVENT_CREATE_CATEGORY_LOCAL,
  EVENT_CREATE_CATEGORY_MUSIC,
  EVENT_CREATE_CATEGORY_OTHER,
  EVENT_CREATE_CATEGORY_SPORT,
  EVENT_CREATE_NEXT_PRACTICAL,
  EVENT_CREATE_NEXT_REVIEW,
  EVENT_CREATE_NEXT_SCHEDULE,
  EVENT_CREATE_NEXT_VISUALS,
  EVENT_CREATE_STEP_ESSENTIALS,
  EVENT_CREATE_STEP_ESSENTIALS_HINT,
  EVENT_CREATE_STEP_PRACTICAL,
  EVENT_CREATE_STEP_REVIEW,
  EVENT_CREATE_STEP_SCHEDULE,
  EVENT_CREATE_STEP_VISUALS,
  EVENT_CREATE_VALIDATION_CATEGORY,
  EVENT_CREATE_VALIDATION_DESC,
  EVENT_CREATE_VALIDATION_LOCATION,
  EVENT_CREATE_VALIDATION_ORG,
  EVENT_CREATE_VALIDATION_STARTS,
  EVENT_CREATE_VALIDATION_TITLE,
} from "./event-create-portal-labels";

export type EventCreateStepId =
  | "essentials"
  | "schedule"
  | "visuals"
  | "practical"
  | "review";

export type EventCreateVisibility = "public" | "private_invite";

export type EventCreateCategoryId =
  | "culture"
  | "music"
  | "food"
  | "sport"
  | "family"
  | "local_life"
  | "other";

export type EventCreateCategoryOption = {
  id: EventCreateCategoryId;
  label: string;
  eventType: string;
  badgeLabel: string;
  badgeTone: "culture" | "music" | "food" | "local" | "default";
};

export type EventCreateStep = {
  id: EventCreateStepId;
  label: string;
  hint?: string;
  order: number;
  nextCta: string;
};

export type EventCreateDraft = {
  organizationId: string;
  title: string;
  categoryId: EventCreateCategoryId | "";
  description: string;
  visibility: EventCreateVisibility;
  isRecurring: boolean;
  startsAt: string;
  locationName: string;
  coverImageUrl: string;
  city: string;
};

export type EventCreateValidation = {
  valid: boolean;
  message: string | null;
};

export const EVENT_CREATE_TITLE_MAX = 80;
export const EVENT_CREATE_DESC_MAX = 140;
export const EVENT_CREATE_DRAFT_STORAGE_KEY = "yunicity-event-create-draft-v1";

export const EVENT_CREATE_STEPS: EventCreateStep[] = [
  {
    id: "essentials",
    label: EVENT_CREATE_STEP_ESSENTIALS,
    hint: EVENT_CREATE_STEP_ESSENTIALS_HINT,
    order: 1,
    nextCta: EVENT_CREATE_NEXT_SCHEDULE,
  },
  {
    id: "schedule",
    label: EVENT_CREATE_STEP_SCHEDULE,
    order: 2,
    nextCta: EVENT_CREATE_NEXT_VISUALS,
  },
  {
    id: "visuals",
    label: EVENT_CREATE_STEP_VISUALS,
    order: 3,
    nextCta: EVENT_CREATE_NEXT_PRACTICAL,
  },
  {
    id: "practical",
    label: EVENT_CREATE_STEP_PRACTICAL,
    order: 4,
    nextCta: EVENT_CREATE_NEXT_REVIEW,
  },
  {
    id: "review",
    label: EVENT_CREATE_STEP_REVIEW,
    order: 5,
    nextCta: EVENT_CREATE_NEXT_REVIEW,
  },
];

export const EVENT_CREATE_CATEGORIES: EventCreateCategoryOption[] = [
  {
    id: "culture",
    label: EVENT_CREATE_CATEGORY_CULTURE,
    eventType: "exhibition",
    badgeLabel: "CULTURE",
    badgeTone: "culture",
  },
  {
    id: "music",
    label: EVENT_CREATE_CATEGORY_MUSIC,
    eventType: "local_concert",
    badgeLabel: "MUSIQUE",
    badgeTone: "music",
  },
  {
    id: "food",
    label: EVENT_CREATE_CATEGORY_FOOD,
    eventType: "local_market",
    badgeLabel: "FOOD",
    badgeTone: "food",
  },
  {
    id: "sport",
    label: EVENT_CREATE_CATEGORY_SPORT,
    eventType: "student_event",
    badgeLabel: "SPORT",
    badgeTone: "default",
  },
  {
    id: "family",
    label: EVENT_CREATE_CATEGORY_FAMILY,
    eventType: "association_evening",
    badgeLabel: "FAMILLE",
    badgeTone: "local",
  },
  {
    id: "local_life",
    label: EVENT_CREATE_CATEGORY_LOCAL,
    eventType: "creator_meetup",
    badgeLabel: "VIE LOCALE",
    badgeTone: "local",
  },
  {
    id: "other",
    label: EVENT_CREATE_CATEGORY_OTHER,
    eventType: "partner_event",
    badgeLabel: "SORTIE",
    badgeTone: "default",
  },
];

export function createEmptyEventCreateDraft(city = "Reims"): EventCreateDraft {
  return {
    organizationId: "",
    title: "",
    categoryId: "",
    description: "",
    visibility: "public",
    isRecurring: false,
    startsAt: "",
    locationName: "",
    coverImageUrl: "",
    city,
  };
}

export function resolveEventCreateCategory(
  categoryId: EventCreateCategoryId | "",
): EventCreateCategoryOption | null {
  if (!categoryId) return null;
  return EVENT_CREATE_CATEGORIES.find((item) => item.id === categoryId) ?? null;
}

export function validateEventCreateStep(
  stepId: EventCreateStepId,
  draft: EventCreateDraft,
): EventCreateValidation {
  if (stepId === "essentials") {
    if (!draft.organizationId.trim()) {
      return { valid: false, message: EVENT_CREATE_VALIDATION_ORG };
    }
    const title = draft.title.trim();
    if (title.length < 2 || title.length > EVENT_CREATE_TITLE_MAX) {
      return { valid: false, message: EVENT_CREATE_VALIDATION_TITLE };
    }
    if (!draft.categoryId) {
      return { valid: false, message: EVENT_CREATE_VALIDATION_CATEGORY };
    }
    const description = draft.description.trim();
    if (description.length < 10 || description.length > EVENT_CREATE_DESC_MAX) {
      return { valid: false, message: EVENT_CREATE_VALIDATION_DESC };
    }
  }

  if (stepId === "schedule") {
    if (!draft.startsAt.trim()) {
      return { valid: false, message: EVENT_CREATE_VALIDATION_STARTS };
    }
    if (!draft.locationName.trim()) {
      return { valid: false, message: EVENT_CREATE_VALIDATION_LOCATION };
    }
  }

  return { valid: true, message: null };
}

export function nextEventCreateStep(stepId: EventCreateStepId): EventCreateStepId | null {
  const index = EVENT_CREATE_STEPS.findIndex((step) => step.id === stepId);
  return EVENT_CREATE_STEPS[index + 1]?.id ?? null;
}

export function previousEventCreateStep(stepId: EventCreateStepId): EventCreateStepId | null {
  const index = EVENT_CREATE_STEPS.findIndex((step) => step.id === stepId);
  return EVENT_CREATE_STEPS[index - 1]?.id ?? null;
}

export function eventCreateChecklistState(draft: EventCreateDraft): {
  essentials: boolean;
  schedule: boolean;
  visual: boolean;
  practical: boolean;
} {
  return {
    essentials: validateEventCreateStep("essentials", draft).valid,
    schedule: validateEventCreateStep("schedule", draft).valid,
    visual: Boolean(draft.coverImageUrl.trim()),
    practical: false,
  };
}

export function eventCreateChecklistProgress(draft: EventCreateDraft): {
  completed: number;
  total: number;
} {
  const state = eventCreateChecklistState(draft);
  const flags = [state.essentials, state.schedule, state.visual, state.practical];
  return { completed: flags.filter(Boolean).length, total: flags.length };
}

export function eventCreateStepProgressPercent(stepId: EventCreateStepId): number {
  const index = EVENT_CREATE_STEPS.findIndex((step) => step.id === stepId);
  if (index < 0) return 0;
  return Math.round(((index + 1) / EVENT_CREATE_STEPS.length) * 100);
}

export function buildEventCreatePayload(draft: EventCreateDraft) {
  const category = resolveEventCreateCategory(draft.categoryId);
  return {
    organization_id: draft.organizationId.trim(),
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    event_type: category?.eventType ?? "partner_event",
    city: draft.city.trim() || "Reims",
    starts_at: draft.startsAt.trim(),
    location_name: draft.locationName.trim(),
    cover_image_url: draft.coverImageUrl.trim() || null,
  };
}
