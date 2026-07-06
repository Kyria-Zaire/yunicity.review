import { describe, expect, it } from "vitest";

import {
  parseStaffSearchParams,
  staffStateToSearchParams,
  toAdminStaffListParams,
} from "./staff-url";

describe("parseStaffSearchParams", () => {
  it("reads role filter from URL", () => {
    expect(parseStaffSearchParams(new URLSearchParams("role=MODERATOR"))).toEqual({
      role: "MODERATOR",
      status: "",
      page: 1,
      pageSize: 20,
    });
  });

  it("reads status filter and legacy active param", () => {
    expect(parseStaffSearchParams(new URLSearchParams("status=suspended"))).toMatchObject({
      status: "suspended",
    });
    expect(parseStaffSearchParams(new URLSearchParams("active=suspended"))).toMatchObject({
      status: "suspended",
    });
  });

  it("round-trips role and status filters", () => {
    const state = {
      role: "CITY_ADMIN" as const,
      status: "active" as const,
      page: 2,
      pageSize: 50,
    };
    const params = staffStateToSearchParams(state);
    expect(parseStaffSearchParams(params)).toEqual(state);
  });
});

describe("toAdminStaffListParams", () => {
  it("maps moderator filter to listStaff role param", () => {
    expect(
      toAdminStaffListParams({
        role: "MODERATOR",
        status: "",
        page: 1,
        pageSize: 20,
      }),
    ).toEqual({
      role: "MODERATOR",
      is_active: undefined,
      page: 1,
      page_size: 20,
    });
  });

  it("maps suspended status to is_active false", () => {
    expect(
      toAdminStaffListParams({
        role: "",
        status: "suspended",
        page: 1,
        pageSize: 20,
      }),
    ).toEqual({
      role: undefined,
      is_active: false,
      page: 1,
      page_size: 20,
    });
  });
});
