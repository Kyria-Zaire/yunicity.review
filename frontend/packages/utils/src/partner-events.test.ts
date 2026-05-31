import { describe, expect, it } from "vitest";

import type { LocalEvent } from "@yunicity/types";

import {
  buildPartnerEventsUrl,
  buildPartnerPlaceHrefFromEvent,
  eventIsPartnerEvent,
  eventOrganizerLabel,
  eventPartnerBadgeLabel,
  getPartnerEventOrganization,
} from "./partner-events";

function baseEvent(overrides: Partial<LocalEvent> = {}): LocalEvent {
  return {
    id: "evt-1",
    organization_id: null,
    title: "Test Event",
    description: null,
    event_type: "partner_event",
    city: "Reims",
    district: null,
    starts_at: "2026-06-14T18:00:00.000Z",
    ends_at: null,
    timezone: "Europe/Paris",
    location_name: "Reims",
    address: null,
    latitude: null,
    longitude: null,
    cover_image_url: null,
    moderation_status: "approved",
    is_cancelled: false,
    interested_by_me: false,
    interest_count: 0,
    organization: null,
    neighborhood_summary: null,
    created_at: "2026-05-31T00:00:00.000Z",
    ...overrides,
  };
}

describe("eventIsPartnerEvent", () => {
  it("returns true for active partner event", () => {
    const event = baseEvent({
      organization: {
        id: "org-1",
        slug: "belga-queen",
        name: "Belga Queen",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "active",
      },
    });
    expect(eventIsPartnerEvent(event)).toBe(true);
  });

  it("returns true for premium partner", () => {
    const event = baseEvent({
      organization: {
        id: "org-2",
        slug: "premium-org",
        name: "Premium Org",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "premium",
      },
    });
    expect(eventIsPartnerEvent(event)).toBe(true);
  });

  it("returns false when organization is null", () => {
    expect(eventIsPartnerEvent(baseEvent())).toBe(false);
  });

  it("returns false when is_partner is false", () => {
    const event = baseEvent({
      organization: {
        id: "org-3",
        slug: "classic-org",
        name: "Classic Org",
        city: "Reims",
        logo_url: null,
        is_partner: false,
        partner_status: null,
      },
    });
    expect(eventIsPartnerEvent(event)).toBe(false);
  });

  it("returns false for signed partner (not public)", () => {
    const event = baseEvent({
      organization: {
        id: "org-4",
        slug: "signed-org",
        name: "Signed Org",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "signed",
      },
    });
    expect(eventIsPartnerEvent(event)).toBe(false);
  });

  it("returns false for paused partner (not public)", () => {
    const event = baseEvent({
      organization: {
        id: "org-5",
        slug: "paused-org",
        name: "Paused Org",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "paused",
      },
    });
    expect(eventIsPartnerEvent(event)).toBe(false);
  });
});

describe("eventOrganizerLabel", () => {
  it("returns org name when present", () => {
    const event = baseEvent({
      organization: {
        id: "org-1",
        slug: "belga-queen",
        name: "Belga Queen",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "active",
      },
    });
    expect(eventOrganizerLabel(event)).toBe("Belga Queen");
  });

  it("returns fallback label when no organization", () => {
    expect(eventOrganizerLabel(baseEvent())).toBe("Événement local");
  });
});

describe("eventPartnerBadgeLabel", () => {
  it("returns 'Partenaire' for active partner", () => {
    const event = baseEvent({
      organization: {
        id: "org-1",
        slug: "belga-queen",
        name: "Belga Queen",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "active",
      },
    });
    expect(eventPartnerBadgeLabel(event)).toBe("Partenaire");
  });

  it("returns 'Partenaire Premium' for premium", () => {
    const event = baseEvent({
      organization: {
        id: "org-2",
        slug: "premium",
        name: "Premium",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "premium",
      },
    });
    expect(eventPartnerBadgeLabel(event)).toBe("Partenaire Premium");
  });

  it("returns 'Partenaire Fondateur' for founding_partner", () => {
    const event = baseEvent({
      organization: {
        id: "org-3",
        slug: "founding",
        name: "Founding Partner",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "founding_partner",
      },
    });
    expect(eventPartnerBadgeLabel(event)).toBe("Partenaire Fondateur");
  });

  it("returns null for non-partner event", () => {
    expect(eventPartnerBadgeLabel(baseEvent())).toBeNull();
  });
});

describe("buildPartnerEventsUrl", () => {
  it("builds URL without city", () => {
    expect(buildPartnerEventsUrl("belga-queen")).toBe("/partners/belga-queen/events");
  });

  it("builds URL with city", () => {
    expect(buildPartnerEventsUrl("belga-queen", "Reims")).toBe(
      "/partners/belga-queen/events?city=Reims",
    );
  });

  it("encodes special characters in slug", () => {
    expect(buildPartnerEventsUrl("garçon-barbiers")).toBe(
      "/partners/gar%C3%A7on-barbiers/events",
    );
  });
});

describe("getPartnerEventOrganization", () => {
  it("returns organization when event is partner event", () => {
    const event = baseEvent({
      organization: {
        id: "org-1",
        slug: "belga-queen",
        name: "Belga Queen",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "active",
      },
    });
    const org = getPartnerEventOrganization(event);
    expect(org).not.toBeNull();
    expect(org?.slug).toBe("belga-queen");
  });

  it("returns null when event is not a partner event", () => {
    expect(getPartnerEventOrganization(baseEvent())).toBeNull();
  });

  it("returns null when organization exists but is_partner is false", () => {
    const event = baseEvent({
      organization: {
        id: "org-2",
        slug: "classic-org",
        name: "Classic Org",
        city: "Reims",
        logo_url: null,
        is_partner: false,
        partner_status: null,
      },
    });
    expect(getPartnerEventOrganization(event)).toBeNull();
  });
});

describe("buildPartnerPlaceHrefFromEvent", () => {
  it("returns exact place href for partner event", () => {
    const event = baseEvent({
      organization: {
        id: "org-1",
        slug: "belga-queen",
        name: "Belga Queen",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "active",
      },
    });
    expect(buildPartnerPlaceHrefFromEvent(event)).toBe("/places/belga-queen?city=Reims");
  });

  it("returns null for non-partner event", () => {
    expect(buildPartnerPlaceHrefFromEvent(baseEvent())).toBeNull();
  });

  it("returns null when organization is null", () => {
    const event = baseEvent({ organization: null });
    expect(buildPartnerPlaceHrefFromEvent(event)).toBeNull();
  });
});

describe("getPartnerEventOrganization — signed/paused return null", () => {
  it("returns null for signed partner", () => {
    const event = baseEvent({
      organization: {
        id: "org-5",
        slug: "signed-org",
        name: "Signed Org",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "signed",
      },
    });
    expect(getPartnerEventOrganization(event)).toBeNull();
  });

  it("returns null for paused partner", () => {
    const event = baseEvent({
      organization: {
        id: "org-6",
        slug: "paused-org",
        name: "Paused Org",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "paused",
      },
    });
    expect(getPartnerEventOrganization(event)).toBeNull();
  });
});
