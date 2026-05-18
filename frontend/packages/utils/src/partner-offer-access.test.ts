import { describe, expect, it } from "vitest";

import { listOfferManageableOrganizations } from "./partner-offer-access";
import type { OrganizationMeItem } from "@yunicity/types";

function org(overrides: Partial<OrganizationMeItem> = {}): OrganizationMeItem {
  return {
    id: "1",
    slug: "lieu",
    name: "Lieu",
    type: "commerce",
    city: "Reims",
    verification_status: "verified",
    visibility: "public",
    onboarding_completed: true,
    member_role: "owner",
    member_status: "active",
    ...overrides,
  };
}

describe("listOfferManageableOrganizations", () => {
  it("filtre orgs éligibles self-service offres", () => {
    const items = [
      org(),
      org({ verification_status: "pending" }),
      org({ member_role: "member" }),
    ];
    expect(listOfferManageableOrganizations(items)).toHaveLength(1);
  });
});
