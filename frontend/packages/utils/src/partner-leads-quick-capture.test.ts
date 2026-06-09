import { describe, expect, it } from "vitest";

import {
  PARTNER_LEAD_QUICK_CAPTURE_DEFAULT_SOURCE,
  PARTNER_LEAD_QUICK_CAPTURE_DEFAULT_TYPE,
  PARTNER_LEAD_QUICK_CAPTURE_SOURCE_VALUES,
  PARTNER_LEAD_QUICK_CAPTURE_TYPE_OPTIONS,
  partnerLeadQuickCapturePartialResetFields,
  partnerLeadQuickCaptureSourceOptions,
} from "./partner-leads-quick-capture";

describe("partnerLeadQuickCaptureSourceOptions", () => {
  it("pré-remplit Terrain et expose les sources terrain", () => {
    expect(PARTNER_LEAD_QUICK_CAPTURE_DEFAULT_SOURCE).toBe("physical_prospecting");
    const options = partnerLeadQuickCaptureSourceOptions();
    expect(options[0]?.label).toBe("Terrain");
    expect(options.map((o) => o.value)).toEqual([...PARTNER_LEAD_QUICK_CAPTURE_SOURCE_VALUES]);
  });
});

describe("PARTNER_LEAD_QUICK_CAPTURE_TYPE_OPTIONS", () => {
  it("expose les types rapides demandés", () => {
    expect(PARTNER_LEAD_QUICK_CAPTURE_DEFAULT_TYPE).toBe("commerce");
    expect(PARTNER_LEAD_QUICK_CAPTURE_TYPE_OPTIONS.map((o) => o.label)).toEqual([
      "Commerce",
      "Association",
      "Lieu",
      "Organisation",
    ]);
  });
});

describe("partnerLeadQuickCapturePartialResetFields", () => {
  it("réinitialise uniquement les champs de saisie rapide", () => {
    expect(partnerLeadQuickCapturePartialResetFields()).toEqual({
      name: "",
      phone: "",
      email: "",
      notes: "",
    });
  });
});
