import { describe, expect, it } from "vitest";

import {
  buildRegisterApiPayload,
  buildRegisterPostAuthPath,
  createEmptyRegisterDraft,
  evaluateRegisterPasswordRules,
  isRegisterPasswordValid,
  nextRegisterStep,
  previousRegisterStep,
  validateRegisterStep,
} from "./register-portal";

describe("register-portal", () => {
  it("creates empty draft with default city", () => {
    const draft = createEmptyRegisterDraft();
    expect(draft.city).toBe("Reims");
    expect(draft.accountType).toBeNull();
  });

  it("validates account type step", () => {
    const draft = createEmptyRegisterDraft();
    expect(validateRegisterStep("type", draft).valid).toBe(false);
    expect(
      validateRegisterStep("type", { ...draft, accountType: "citizen" }).valid,
    ).toBe(true);
  });

  it("validates password rules like backend", () => {
    expect(isRegisterPasswordValid("short")).toBe(false);
    expect(isRegisterPasswordValid("StrongPassword1")).toBe(true);
    expect(evaluateRegisterPasswordRules("StrongPassword1")).toEqual({
      length: true,
      upper: true,
      lower: true,
      digit: true,
    });
  });

  it("validates info step", () => {
    const draft = {
      ...createEmptyRegisterDraft(),
      accountType: "citizen" as const,
      fullName: "Alice Martin",
      email: "alice@example.com",
      password: "StrongPassword1",
      confirmPassword: "StrongPassword1",
      city: "Reims",
    };
    expect(validateRegisterStep("info", draft).valid).toBe(true);
    expect(
      validateRegisterStep("info", { ...draft, confirmPassword: "Mismatch1!" }).valid,
    ).toBe(false);
  });

  it("navigates steps", () => {
    expect(nextRegisterStep("type")).toBe("info");
    expect(previousRegisterStep("info")).toBe("type");
    expect(nextRegisterStep("finish")).toBeNull();
  });

  it("builds post-auth path", () => {
    expect(buildRegisterPostAuthPath("citizen")).toBe("/feed");
    expect(buildRegisterPostAuthPath("commerce")).toBe("/organizations/request?type=commerce");
  });

  it("builds API payload", () => {
    const payload = buildRegisterApiPayload({
      ...createEmptyRegisterDraft(),
      accountType: "citizen",
      fullName: " Alice ",
      email: " ALICE@Example.com ",
      password: "StrongPassword1",
      confirmPassword: "StrongPassword1",
      city: " Reims ",
      acceptedTerms: true,
    });
    expect(payload).toEqual({
      email: "alice@example.com",
      password: "StrongPassword1",
      full_name: "Alice",
      city: "Reims",
    });
  });
});
