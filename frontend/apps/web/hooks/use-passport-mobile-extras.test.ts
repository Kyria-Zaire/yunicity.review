import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = fileURLToPath(new URL(".", import.meta.url));
const hook = readFileSync(`${here}use-passport-mobile-extras.ts`, "utf-8");

describe("usePassportMobileExtras — compatibilité callsites", () => {
  it("accepte l'appel legacy à un seul argument via hasActivePassport optionnel", () => {
    expect(hook).toMatch(/export function usePassportMobileExtras\(enabled: boolean, hasActivePassport = true\)/);
  });

  it("conserve le garde-fou enabled && hasActivePassport avant fetch", () => {
    expect(hook).toMatch(/if \(!enabled \|\| !hasActivePassport\)/);
  });
});
