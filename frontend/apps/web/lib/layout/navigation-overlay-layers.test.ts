import { describe, expect, it } from "vitest";
import { yunicitySemantic } from "@yunicity/ui";

import { Z_INDEX } from "./z-index";
import { NAVIGATION_MODAL_Z_INDEX } from "./navigation-overlay-layers";

describe("navigation overlay layers — C3.1-R1", () => {
  it("utilise la couche sémantique modal, au-dessus du chrome et sous le Drawer vidéo", () => {
    expect(NAVIGATION_MODAL_Z_INDEX).toBe(yunicitySemantic.z.modal);
    expect(NAVIGATION_MODAL_Z_INDEX).toBeGreaterThan(Z_INDEX.CHROME);
    expect(NAVIGATION_MODAL_Z_INDEX).toBeLessThan(Z_INDEX.VIDEO_REPORT);
    expect(NAVIGATION_MODAL_Z_INDEX).toBe(50);
    expect(Z_INDEX.CHROME).toBe(40);
    expect(yunicitySemantic.z.popover).toBe(60);
    expect(Z_INDEX.VIDEO_REPORT).toBe(70);
  });
});
