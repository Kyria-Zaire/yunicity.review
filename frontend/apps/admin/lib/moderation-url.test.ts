import { describe, expect, it } from "vitest";

import {
  moderationStateToSearchParams,
  parseModerationSearchParams,
} from "./moderation-url";

describe("parseModerationSearchParams", () => {
  it("defaults to pending when no params", () => {
    expect(parseModerationSearchParams(new URLSearchParams())).toEqual({
      status: "pending",
      reason: "",
      page: 1,
      pageSize: 20,
    });
  });

  it("round-trips filters and pagination", () => {
    const state = {
      status: "all" as const,
      reason: "spam" as const,
      page: 2,
      pageSize: 50,
    };
    const params = moderationStateToSearchParams(state);
    expect(parseModerationSearchParams(params)).toEqual(state);
  });
});
