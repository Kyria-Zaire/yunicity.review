import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isRegistrationEnabled, resolveRegistrationEnabled } from "./registration-availability";

describe("resolveRegistrationEnabled", () => {
  it("ferme uniquement sur une valeur explicitement fausse", () => {
    for (const valeur of ["false", "FALSE", " False ", "0", "no", "off", "OFF"]) {
      expect(resolveRegistrationEnabled(valeur), `« ${valeur} » devrait fermer`).toBe(false);
    }
  });

  it("reste ouvert pour toute autre valeur", () => {
    for (const valeur of ["true", "TRUE", "1", "yes", "on", "n'importe quoi"]) {
      expect(resolveRegistrationEnabled(valeur), `« ${valeur} » devrait rester ouvert`).toBe(true);
    }
  });

  it("reste ouvert quand la variable est absente ou vide", () => {
    // Fermer par defaut couperait l'inscription en developpement local et sur
    // tout environnement qui ne declare pas la variable.
    expect(resolveRegistrationEnabled(undefined)).toBe(true);
    expect(resolveRegistrationEnabled(null)).toBe(true);
    expect(resolveRegistrationEnabled("")).toBe(true);
    expect(resolveRegistrationEnabled("   ")).toBe(true);
  });
});

describe("isRegistrationEnabled", () => {
  const initial = process.env.NEXT_PUBLIC_REGISTRATION_ENABLED;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_REGISTRATION_ENABLED;
  });

  afterEach(() => {
    if (initial === undefined) delete process.env.NEXT_PUBLIC_REGISTRATION_ENABLED;
    else process.env.NEXT_PUBLIC_REGISTRATION_ENABLED = initial;
  });

  it("lit la variable publique", () => {
    process.env.NEXT_PUBLIC_REGISTRATION_ENABLED = "false";
    expect(isRegistrationEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_REGISTRATION_ENABLED = "true";
    expect(isRegistrationEnabled()).toBe(true);
  });

  it("ouvre quand la variable n'est pas declaree", () => {
    expect(isRegistrationEnabled()).toBe(true);
  });
});
