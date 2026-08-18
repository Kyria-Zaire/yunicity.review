import { describe, expect, it } from "vitest";

import {
  reduceSearchCityState,
  resolveSearchCityFromUrl,
  type SearchCityState,
} from "./search-city-state";

describe("resolveSearchCityFromUrl", () => {
  it("retourne ready quand city est présente dans l'URL", () => {
    expect(resolveSearchCityFromUrl(" Reims ")).toEqual({ status: "ready", city: "Reims" });
  });

  it("retourne null quand l'URL ne fournit pas de ville", () => {
    expect(resolveSearchCityFromUrl("")).toBeNull();
    expect(resolveSearchCityFromUrl(null)).toBeNull();
  });
});

describe("reduceSearchCityState", () => {
  it("reste loading tant que le profil n'a pas répondu", () => {
    expect(
      reduceSearchCityState({ status: "loading" }, { type: "profile-pending" }, 0),
    ).toEqual({
      status: "loading",
    });
  });

  it("passe ready avec la ville du profil", () => {
    const next = reduceSearchCityState(
      { status: "loading" },
      { type: "profile-success", city: " Reims ", generation: 1 },
      1,
    );
    expect(next).toEqual({ status: "ready", city: "Reims" });
  });

  it("passe missing seulement après succès sans ville", () => {
    const next = reduceSearchCityState(
      { status: "loading" },
      { type: "profile-success", city: null, generation: 1 },
      1,
    );
    expect(next).toEqual({ status: "missing" });
  });

  it("passe error sur échec réseau avec retry", () => {
    const retry = () => undefined;
    const next = reduceSearchCityState(
      { status: "loading" },
      { type: "profile-error", retry, generation: 1 },
      1,
    );
    expect(next).toEqual({ status: "error", retry });
  });

  it("ignore les réponses obsolètes", () => {
    const next = reduceSearchCityState(
      { status: "loading" },
      { type: "profile-success", city: "Reims", generation: 1 },
      2,
    );
    expect(next).toEqual({ status: "loading" });
  });
});

describe("SearchCityState — invariants", () => {
  it("error ne prétend pas que le profil est incomplet", () => {
    const state: SearchCityState = {
      status: "error",
      retry: () => undefined,
    };
    expect(state.status).toBe("error");
    expect("city" in state).toBe(false);
  });
});
