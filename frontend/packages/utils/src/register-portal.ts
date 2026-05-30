import type { OrganizationType } from "@yunicity/types";

import {
  REGISTER_TYPE_ASSOCIATION_BADGE,
  REGISTER_TYPE_ASSOCIATION_DESC,
  REGISTER_TYPE_ASSOCIATION_TITLE,
  REGISTER_TYPE_CITIZEN_BADGE,
  REGISTER_TYPE_CITIZEN_DESC,
  REGISTER_TYPE_CITIZEN_TITLE,
  REGISTER_TYPE_COMMERCE_BADGE,
  REGISTER_TYPE_COMMERCE_DESC,
  REGISTER_TYPE_COMMERCE_TITLE,
  REGISTER_TYPE_OTHER_BADGE,
  REGISTER_TYPE_OTHER_DESC,
  REGISTER_TYPE_OTHER_TITLE,
  REGISTER_TYPE_PUBLIC_BADGE,
  REGISTER_TYPE_PUBLIC_DESC,
  REGISTER_TYPE_PUBLIC_TITLE,
  REGISTER_TYPE_SCHOOL_BADGE,
  REGISTER_TYPE_SCHOOL_DESC,
  REGISTER_TYPE_SCHOOL_TITLE,
  REGISTER_STEP_FINISH,
  REGISTER_STEP_INFO,
  REGISTER_STEP_TYPE,
  REGISTER_STEP_VERIFY,
  REGISTER_VALIDATION_ACCOUNT_TYPE,
  REGISTER_VALIDATION_CITY,
  REGISTER_VALIDATION_CONFIRM_PASSWORD,
  REGISTER_VALIDATION_EMAIL,
  REGISTER_VALIDATION_FULL_NAME,
  REGISTER_VALIDATION_PASSWORD,
  REGISTER_VALIDATION_TERMS,
} from "./register-portal-labels";

export type RegisterAccountTypeId =
  | "citizen"
  | "commerce"
  | "association"
  | "public_agency"
  | "school"
  | "other";

export type RegisterStepId = "type" | "info" | "verify" | "finish";

export type RegisterPasswordRuleId = "length" | "upper" | "lower" | "digit";

export type RegisterAccountTypeOption = {
  id: RegisterAccountTypeId;
  title: string;
  description: string;
  badge: string;
  badgeClassName: string;
  iconToneClassName: string;
  organizationType: OrganizationType | null;
};

export type RegisterDraft = {
  accountType: RegisterAccountTypeId | null;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  city: string;
  acceptedTerms: boolean;
};

export type RegisterStep = {
  id: RegisterStepId;
  label: string;
  order: number;
};

export type RegisterValidation = {
  valid: boolean;
  message: string | null;
};

export const REGISTER_DEFAULT_CITY = "Reims";

export const REGISTER_STEPS: RegisterStep[] = [
  { id: "type", label: REGISTER_STEP_TYPE, order: 1 },
  { id: "info", label: REGISTER_STEP_INFO, order: 2 },
  { id: "verify", label: REGISTER_STEP_VERIFY, order: 3 },
  { id: "finish", label: REGISTER_STEP_FINISH, order: 4 },
];

export const REGISTER_ACCOUNT_TYPE_OPTIONS: RegisterAccountTypeOption[] = [
  {
    id: "citizen",
    title: REGISTER_TYPE_CITIZEN_TITLE,
    description: REGISTER_TYPE_CITIZEN_DESC,
    badge: REGISTER_TYPE_CITIZEN_BADGE,
    badgeClassName: "bg-[#EEF0FF] text-yunicity-primary",
    iconToneClassName: "bg-[#EEF0FF] text-yunicity-primary",
    organizationType: null,
  },
  {
    id: "commerce",
    title: REGISTER_TYPE_COMMERCE_TITLE,
    description: REGISTER_TYPE_COMMERCE_DESC,
    badge: REGISTER_TYPE_COMMERCE_BADGE,
    badgeClassName: "bg-orange-50 text-orange-700",
    iconToneClassName: "bg-orange-50 text-orange-600",
    organizationType: "commerce",
  },
  {
    id: "association",
    title: REGISTER_TYPE_ASSOCIATION_TITLE,
    description: REGISTER_TYPE_ASSOCIATION_DESC,
    badge: REGISTER_TYPE_ASSOCIATION_BADGE,
    badgeClassName: "bg-emerald-50 text-emerald-700",
    iconToneClassName: "bg-emerald-50 text-emerald-600",
    organizationType: "association",
  },
  {
    id: "public_agency",
    title: REGISTER_TYPE_PUBLIC_TITLE,
    description: REGISTER_TYPE_PUBLIC_DESC,
    badge: REGISTER_TYPE_PUBLIC_BADGE,
    badgeClassName: "bg-sky-50 text-sky-700",
    iconToneClassName: "bg-sky-50 text-sky-600",
    organizationType: "public_agency",
  },
  {
    id: "school",
    title: REGISTER_TYPE_SCHOOL_TITLE,
    description: REGISTER_TYPE_SCHOOL_DESC,
    badge: REGISTER_TYPE_SCHOOL_BADGE,
    badgeClassName: "bg-violet-50 text-violet-700",
    iconToneClassName: "bg-violet-50 text-violet-600",
    organizationType: "school",
  },
  {
    id: "other",
    title: REGISTER_TYPE_OTHER_TITLE,
    description: REGISTER_TYPE_OTHER_DESC,
    badge: REGISTER_TYPE_OTHER_BADGE,
    badgeClassName: "bg-pink-50 text-pink-700",
    iconToneClassName: "bg-pink-50 text-pink-600",
    organizationType: "other",
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createEmptyRegisterDraft(city = REGISTER_DEFAULT_CITY): RegisterDraft {
  return {
    accountType: null,
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    city,
    acceptedTerms: false,
  };
}

export function resolveRegisterAccountType(
  accountType: RegisterAccountTypeId | null,
): RegisterAccountTypeOption | null {
  if (!accountType) return null;
  return REGISTER_ACCOUNT_TYPE_OPTIONS.find((option) => option.id === accountType) ?? null;
}

export function isCitizenRegisterAccountType(accountType: RegisterAccountTypeId | null): boolean {
  return accountType === "citizen";
}

export function evaluateRegisterPasswordRules(
  password: string,
): Record<RegisterPasswordRuleId, boolean> {
  return {
    length: password.length >= 12 && password.length <= 128,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
  };
}

export function isRegisterPasswordValid(password: string): boolean {
  const rules = evaluateRegisterPasswordRules(password);
  return rules.length && rules.upper && rules.lower && rules.digit;
}

export function validateRegisterStep(stepId: RegisterStepId, draft: RegisterDraft): RegisterValidation {
  if (stepId === "type") {
    if (!draft.accountType) {
      return { valid: false, message: REGISTER_VALIDATION_ACCOUNT_TYPE };
    }
    return { valid: true, message: null };
  }

  if (stepId === "info") {
    if (draft.fullName.trim().length < 2) {
      return { valid: false, message: REGISTER_VALIDATION_FULL_NAME };
    }
    if (!EMAIL_PATTERN.test(draft.email.trim().toLowerCase())) {
      return { valid: false, message: REGISTER_VALIDATION_EMAIL };
    }
    if (!isRegisterPasswordValid(draft.password)) {
      return { valid: false, message: REGISTER_VALIDATION_PASSWORD };
    }
    if (draft.password !== draft.confirmPassword) {
      return { valid: false, message: REGISTER_VALIDATION_CONFIRM_PASSWORD };
    }
    if (draft.city.trim().length < 2) {
      return { valid: false, message: REGISTER_VALIDATION_CITY };
    }
    return { valid: true, message: null };
  }

  if (stepId === "verify") {
    if (!isRegisterPasswordValid(draft.password)) {
      return { valid: false, message: REGISTER_VALIDATION_PASSWORD };
    }
    if (!draft.acceptedTerms) {
      return { valid: false, message: REGISTER_VALIDATION_TERMS };
    }
    return { valid: true, message: null };
  }

  if (stepId === "finish") {
    const typeValidation = validateRegisterStep("type", draft);
    if (!typeValidation.valid) return typeValidation;
    const infoValidation = validateRegisterStep("info", draft);
    if (!infoValidation.valid) return infoValidation;
    const verifyValidation = validateRegisterStep("verify", draft);
    if (!verifyValidation.valid) return verifyValidation;
    return { valid: true, message: null };
  }

  return { valid: true, message: null };
}

export function nextRegisterStep(stepId: RegisterStepId): RegisterStepId | null {
  const index = REGISTER_STEPS.findIndex((step) => step.id === stepId);
  if (index < 0 || index >= REGISTER_STEPS.length - 1) return null;
  return REGISTER_STEPS[index + 1]?.id ?? null;
}

export function previousRegisterStep(stepId: RegisterStepId): RegisterStepId | null {
  const index = REGISTER_STEPS.findIndex((step) => step.id === stepId);
  if (index <= 0) return null;
  return REGISTER_STEPS[index - 1]?.id ?? null;
}

export function buildRegisterPostAuthPath(accountType: RegisterAccountTypeId | null): string {
  const resolved = resolveRegisterAccountType(accountType);
  if (!resolved?.organizationType) {
    return "/feed";
  }
  return `/organizations/request?type=${encodeURIComponent(resolved.organizationType)}`;
}

export function buildRegisterApiPayload(draft: RegisterDraft): {
  email: string;
  password: string;
  full_name: string;
  city: string;
} {
  return {
    email: draft.email.trim().toLowerCase(),
    password: draft.password,
    full_name: draft.fullName.trim(),
    city: draft.city.trim(),
  };
}
