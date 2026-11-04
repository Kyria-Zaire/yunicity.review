import { describe, expect, it } from "vitest";

import { PUBLIC_HOME_ROUTES } from "./public-home-contract";

describe("public-home-contract", () => {
  it("pointe le lien Aide vers le centre d'aide", () => {
    expect(PUBLIC_HOME_ROUTES.help).toBe("/aide");
  });
});
