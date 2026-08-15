import { describe, expect, it } from "vitest";

import { cx } from "./class-names";

describe("cx", () => {
  it("concatène les classes non vides", () => {
    expect(cx("a", "b")).toBe("a b");
  });

  it("ignore les valeurs conditionnelles fausses", () => {
    expect(cx("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("place la classe du consommateur en dernier", () => {
    expect(cx("base", "variant", "mt-4")).toBe("base variant mt-4");
  });
});
