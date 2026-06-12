import { isRegisterPasswordValid } from "./register-portal";
import {
  RESET_PASSWORD_VALIDATION_CONFIRM,
  RESET_PASSWORD_VALIDATION_EMAIL,
  RESET_PASSWORD_VALIDATION_PASSWORD,
  RESET_PASSWORD_VALIDATION_TOKEN,
} from "./password-reset-portal-labels";

export type ForgotPasswordFormValues = {
  email: string;
};

export type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

export type PasswordResetValidation = {
  valid: boolean;
  message: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeForgotPasswordEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateForgotPasswordForm(
  values: ForgotPasswordFormValues,
): PasswordResetValidation {
  if (!EMAIL_PATTERN.test(normalizeForgotPasswordEmail(values.email))) {
    return { valid: false, message: RESET_PASSWORD_VALIDATION_EMAIL };
  }
  return { valid: true, message: null };
}

export function buildForgotPasswordApiPayload(
  values: ForgotPasswordFormValues,
): ForgotPasswordFormValues {
  return {
    email: normalizeForgotPasswordEmail(values.email),
  };
}

export function validateResetPasswordForm(
  values: ResetPasswordFormValues,
): PasswordResetValidation {
  if (!isRegisterPasswordValid(values.password)) {
    return { valid: false, message: RESET_PASSWORD_VALIDATION_PASSWORD };
  }
  if (values.password !== values.confirmPassword) {
    return { valid: false, message: RESET_PASSWORD_VALIDATION_CONFIRM };
  }
  return { valid: true, message: null };
}

export function validateResetPasswordToken(token: string | null): PasswordResetValidation {
  if (!token?.trim()) {
    return { valid: false, message: RESET_PASSWORD_VALIDATION_TOKEN };
  }
  return { valid: true, message: null };
}

export function buildResetPasswordApiPayload(
  token: string,
  values: ResetPasswordFormValues,
): { token: string; new_password: string } {
  return {
    token: token.trim(),
    new_password: values.password,
  };
}
