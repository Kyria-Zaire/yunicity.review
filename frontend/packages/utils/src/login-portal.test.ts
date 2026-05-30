import { describe, expect, it } from "vitest";

import {
  buildLoginApiPayload,
  normalizeLoginEmail,
  validateLoginForm,
} from "./login-portal";

describe("login-portal", () => {
  it("normalizes email", () => {
    expect(normalizeLoginEmail("  Alice@Example.com ")).toBe("alice@example.com");
  });

  it("validates login form", () => {
    expect(validateLoginForm({ email: "bad", password: "x" }).valid).toBe(false);
    expect(
      validateLoginForm({ email: "alice@example.com", password: "secret" }).valid,
    ).toBe(true);
  });

  it("builds API payload", () => {
    expect(
      buildLoginApiPayload({ email: " ALICE@Example.com ", password: "secret" }),
    ).toEqual({
      email: "alice@example.com",
      password: "secret",
    });
  });
});
