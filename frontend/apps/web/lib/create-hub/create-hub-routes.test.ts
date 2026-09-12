import { describe, expect, it } from "vitest";

import {
  CREATE_HUB_HIDDEN_PATH_PREFIXES,
  CREATE_HUB_SURFACES,
  type CreateHubSurface,
  isCreateHubAvailableOnRoute,
  isCreateHubVisiblePath,
  resolveCreateHubVisibility,
} from "./create-hub-routes";

describe("create-hub-routes — politique par route", () => {
  it("masque Créer sur les parcours de création", () => {
    expect(isCreateHubVisiblePath("/videos/new")).toBe(false);
    expect(isCreateHubVisiblePath("/feed/new")).toBe(false);
    expect(isCreateHubVisiblePath("/stories/new")).toBe(false);
    expect(isCreateHubVisiblePath("/sortir/create")).toBe(false);
  });

  it("masque Créer sur les routes d'authentification", () => {
    expect(isCreateHubVisiblePath("/login")).toBe(false);
    expect(isCreateHubVisiblePath("/register")).toBe(false);
  });

  it("garde Créer visible sur les portails", () => {
    expect(isCreateHubVisiblePath("/feed")).toBe(true);
    expect(isCreateHubVisiblePath("/stories")).toBe(true);
  });

  /**
   * Invariant de la liste, énoncé par sa propre docstring : « écran création en
   * cours ». Toute entrée qui n'est ni un parcours de création, ni une route
   * d'authentification, est une erreur de catégorie — c'était le défaut R1D
   * de `/videos`.
   */
  it("n'inscrit que des écrans de création ou d'authentification", () => {
    const auth = ["/login", "/register"];
    const creationSuffixes = ["/new", "/create"];
    for (const prefixe of CREATE_HUB_HIDDEN_PATH_PREFIXES) {
      if (auth.includes(prefixe)) continue;
      expect(creationSuffixes.some((suffix) => prefixe.endsWith(suffix))).toBe(true);
    }
  });
});

describe("create-hub-routes — politique par surface (R1E)", () => {
  /**
   * `/videos` n'est pas un parcours de création : le rail citoyen medium doit y
   * porter ses neuf contrôles. Mais mobile et desktop restent gelés sur leur
   * comportement historique — le portail y garde son seul CTA « Publier une
   * vidéo ». La route ne suffit donc plus à décider : il faut la SURFACE.
   */
  it("/videos : visible sur le rail citoyen medium", () => {
    expect(
      resolveCreateHubVisibility({ pathname: "/videos", surface: "citizen-medium-rail" }),
    ).toBe(true);
  });

  it("/videos : masqué sur la surface par défaut (mobile, desktop)", () => {
    expect(resolveCreateHubVisibility({ pathname: "/videos", surface: "default" })).toBe(false);
    expect(resolveCreateHubVisibility({ pathname: "/videos" })).toBe(false);
    expect(isCreateHubVisiblePath("/videos")).toBe(false);
  });

  it("/videos/new : masqué sur TOUTES les surfaces", () => {
    for (const surface of CREATE_HUB_SURFACES) {
      expect(resolveCreateHubVisibility({ pathname: "/videos/new", surface })).toBe(false);
    }
  });

  it("les parcours de création restent masqués sur toutes les surfaces", () => {
    for (const surface of CREATE_HUB_SURFACES) {
      for (const route of ["/feed/new", "/stories/new", "/sortir/create", "/login", "/register"]) {
        expect(resolveCreateHubVisibility({ pathname: route, surface })).toBe(false);
      }
    }
  });

  it("les autres routes gardent leur politique historique sur les deux surfaces", () => {
    for (const route of ["/feed", "/search", "/tribes", "/passport", "/sortir"]) {
      for (const surface of CREATE_HUB_SURFACES) {
        expect(resolveCreateHubVisibility({ pathname: route, surface })).toBe(true);
      }
    }
  });

  it("compare le pathname exactement : /videos-extra n'est pas /videos", () => {
    expect(resolveCreateHubVisibility({ pathname: "/videos-extra", surface: "default" })).toBe(
      true,
    );
    expect(resolveCreateHubVisibility({ pathname: "/videosaurus" })).toBe(true);
  });

  it("ignore query et hash", () => {
    expect(
      resolveCreateHubVisibility({ pathname: "/videos?video=abc", surface: "citizen-medium-rail" }),
    ).toBe(true);
    expect(resolveCreateHubVisibility({ pathname: "/videos?video=abc" })).toBe(false);
    expect(resolveCreateHubVisibility({ pathname: "/videos#top" })).toBe(false);
    expect(resolveCreateHubVisibility({ pathname: "/videos/" })).toBe(false);
  });

  it("ne mute pas son entrée", () => {
    const entree: { pathname: string; surface: CreateHubSurface } = {
      pathname: "/videos",
      surface: "citizen-medium-rail",
    };
    const copie = { ...entree };
    resolveCreateHubVisibility(entree);
    expect(entree).toEqual(copie);
  });

  /**
   * Le provider ne rend qu'UN dialogue pour toutes les surfaces : il doit donc
   * savoir si le hub est atteignable depuis au moins une d'entre elles, sinon
   * le bouton du rail ouvrirait le vide sur `/videos`.
   */
  it("le hub reste disponible sur la route dès qu'une surface l'expose", () => {
    expect(isCreateHubAvailableOnRoute("/videos")).toBe(true);
    expect(isCreateHubAvailableOnRoute("/feed")).toBe(true);
    expect(isCreateHubAvailableOnRoute("/videos/new")).toBe(false);
    expect(isCreateHubAvailableOnRoute("/login")).toBe(false);
  });

  it("est PUR : aucun DOM, aucun window, aucun breakpoint", () => {
    const source = resolveCreateHubVisibility.toString();
    for (const interdit of ["window", "document", "matchMedia", "innerWidth"]) {
      expect(source.includes(interdit), `contrat impur : ${interdit}`).toBe(false);
    }
  });
});
