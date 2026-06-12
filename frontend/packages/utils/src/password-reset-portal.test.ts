import { describe, expect, it } from "vitest";

import {
  buildForgotPasswordApiPayload,
  buildResetPasswordApiPayload,
  normalizeForgotPasswordEmail,
  validateForgotPasswordForm,
  validateResetPasswordForm,
  validateResetPasswordToken,
} from "./password-reset-portal";

describe("password-reset-portal", () => {
  it("normalizes forgot email", () => {
    expect(normalizeForgotPasswordEmail("  Alice@Example.com ")).toBe("alice@example.com");
  });

  it("validates forgot form", () => {
    expect(validateForgotPasswordForm({ email: "bad" }).valid).toBe(false);
    expect(validateForgotPasswordForm({ email: "alice@example.com" }).valid).toBe(true);
  });

  it("builds forgot API payload", () => {
    expect(buildForgotPasswordApiPayload({ email: " ALICE@Example.com " })).toEqual({
      email: "alice@example.com",
    });
  });

  it("validates reset form", () => {
    expect(
      validateResetPasswordForm({ password: "short", confirmPassword: "short" }).valid,
    ).toBe(false);
    expect(
      validateResetPasswordForm({
        password: "StrongPassword1!",
        confirmPassword: "StrongPassword1!",
      }).valid,
    ).toBe(true);
    expect(
      validateResetPasswordForm({
        password: "StrongPassword1!",
        confirmPassword: "OtherPassword1!",
      }).valid,
    ).toBe(false);
  });

  it("validates reset token presence", () => {
    expect(validateResetPasswordToken(null).valid).toBe(false);
    expect(validateResetPasswordToken("abc").valid).toBe(true);
  });

  it("builds reset API payload", () => {
    expect(
      buildResetPasswordApiPayload(" token ", {
        password: "StrongPassword1!",
        confirmPassword: "StrongPassword1!",
      }),
    ).toEqual({
      token: "token",
      new_password: "StrongPassword1!",
    });
  });
});
