import { describe, expect, it } from "vitest";

import {
  permissionStateFromGeolocationError,
  resolveCityForUi,
  shouldUseFallbackCity,
} from "./geo";

describe("permissionStateFromGeolocationError", () => {
  it("maps PERMISSION_DENIED to denied", () => {
    expect(permissionStateFromGeolocationError({ code: 1 })).toBe("denied");
  });

  it("maps TIMEOUT to error", () => {
    expect(permissionStateFromGeolocationError({ code: 3 })).toBe("error");
  });

  it("maps unknown errors to error", () => {
    expect(permissionStateFromGeolocationError(null)).toBe("error");
  });
});

describe("shouldUseFallbackCity", () => {
  it("uses fallback when permission is not granted", () => {
    expect(shouldUseFallbackCity("unknown")).toBe(true);
    expect(shouldUseFallbackCity("denied")).toBe(true);
    expect(shouldUseFallbackCity("error")).toBe(true);
  });

  it("does not force fallback when granted", () => {
    expect(shouldUseFallbackCity("granted")).toBe(false);
  });
});

describe("resolveCityForUi", () => {
  it("prefers geo city when permission granted", () => {
    expect(
      resolveCityForUi({
        permissionState: "granted",
        currentCityFromGeo: "Laon",
        fallbackCity: "Reims",
      }),
    ).toBe("Laon");
  });

  it("falls back to profile/default city when permission not granted", () => {
    expect(
      resolveCityForUi({
        permissionState: "denied",
        currentCityFromGeo: "Laon",
        fallbackCity: "Reims",
      }),
    ).toBe("Reims");
  });

  it("falls back when granted but geo city missing", () => {
    expect(
      resolveCityForUi({
        permissionState: "granted",
        currentCityFromGeo: null,
        fallbackCity: "Reims",
      }),
    ).toBe("Reims");
  });
});
