import { describe, expect, it } from "vitest";

import * as primitives from "./index";

describe("primitives — surface publique", () => {
  it("exporte Dialog et Popover sans fuiter les symboles internes", () => {
    expect(primitives).toHaveProperty("Dialog");
    expect(primitives).toHaveProperty("Popover");
    expect(primitives).not.toHaveProperty("OverlayPanel");
    expect(primitives).not.toHaveProperty("registerOverlay");
    expect(primitives).not.toHaveProperty("acquireScrollLock");
    expect(primitives).not.toHaveProperty("resolveTabTrap");
    expect(primitives).not.toHaveProperty("closedTransform");
    expect(primitives).not.toHaveProperty("enteredTransform");
    expect(primitives).not.toHaveProperty("panelPositionClass");
  });
});
