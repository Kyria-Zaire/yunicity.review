import {
  LOGIN_VALIDATION_EMAIL,
  LOGIN_VALIDATION_PASSWORD,
} from "./login-portal-labels";

export type LoginFormValues = {
  email: string;
  password: string;
};

export type LoginValidation = {
  valid: boolean;
  message: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeLoginEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateLoginForm(values: LoginFormValues): LoginValidation {
  if (!EMAIL_PATTERN.test(normalizeLoginEmail(values.email))) {
    return { valid: false, message: LOGIN_VALIDATION_EMAIL };
  }
  if (!values.password.trim()) {
    return { valid: false, message: LOGIN_VALIDATION_PASSWORD };
  }
  return { valid: true, message: null };
}

export function buildLoginApiPayload(values: LoginFormValues): LoginFormValues {
  return {
    email: normalizeLoginEmail(values.email),
    password: values.password,
  };
}
