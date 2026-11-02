// @vitest-environment jsdom

/**
 * MEDIA-MULTI-PHOTO-01 — parcours de la visionneuse.
 *
 * ── Le problème que ce parcours résout ──────────────────────────────────────
 * La grille plafonne à QUATRE tuiles. Au-delà, les photos n'étaient
 * atteignables par aucun geste : le badge « +N » est décoratif
 * (`pointer-events: none`) et vit DANS le bouton de la quatrième tuile.
 * Le plafond restant une contrainte, le parcours vit dans la visionneuse.
 *
 * ── Ce qui est vérifié, et pourquoi par les APPELS RÉSEAU ──────────────────
 * Un média protégé n'atteint l'écran qu'après sa résolution authentifiée.
 * Compter les appels, et leur ORDRE, prouve donc à la fois le parcours et la
 * règle « résoudre à mesure de la consultation » — ce qu'aucune assertion de
 * DOM ne montrerait.
 */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FeedMediaViewerHost } from "@/components/feed/feed-media-viewer-host";
import { FeedPublicationMedia } from "@/components/feed/feed-publication-media";
import { __resetFeedMediaViewerSessionForTests } from "@/lib/feed/feed-media-viewer-session";
import { __resetAuthorizedMediaSessionForTests } from "@yunicity/utils";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const BASE = "/api/v1/story-media/11111111-1111-4111-8111-111111111111";
const photo = (n: number) => `${BASE}/photo-${n}.jpg`;
const batch = (n: number) => Array.from({ length: n }, (_, i) => photo(i + 1));

const { fetchAuthorizedMediaBlob, apiStub } = vi.hoisted(() => {
  const fetchAuthorizedMediaBlob = vi.fn();
  return { fetchAuthorizedMediaBlob, apiStub: { fetchAuthorizedMediaBlob } };
});

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => apiStub,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/feed",
}));

const requestedUrls = (): string[] =>
  fetchAuthorizedMediaBlob.mock.calls.map((call) => String(call[0]));

let blobCounter = 0;

beforeEach(() => {
  blobCounter = 0;
  // Le registre n'accepte QUE des `blob:` — un stub d'une autre forme serait
  // refusé silencieusement et la tuile resterait en chargement.
  Object.defineProperty(URL, "createObjectURL", {
    value: vi.fn(() => `blob:media-${++blobCounter}`),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    value: vi.fn(),
    writable: true,
    configurable: true,
  });
  fetchAuthorizedMediaBlob.mockImplementation(async (url: string) => ({
    blob: new Blob([url]),
  }));
});

afterEach(() => {
  cleanup();
  __resetFeedMediaViewerSessionForTests();
  __resetAuthorizedMediaSessionForTests();
  fetchAuthorizedMediaBlob.mockReset();
});

/**
 * jsdom ne déclenche jamais `load` sur une `<img>` : sans ce coup de pouce,
 * la tuile resterait en `decoding` et son bouton n'existerait pas.
 */
async function renderAndOpenTiles(urls: string[], expectedTiles: number) {
  const rendered = render(
    <>
      <FeedPublicationMedia mediaUrls={urls} label="Reims" />
      <FeedMediaViewerHost />
    </>,
  );

  await waitFor(() => {
    expect(
      rendered.container.querySelectorAll('[data-authorized-media-state="decoding"] img').length,
    ).toBe(expectedTiles);
  });
  for (const img of Array.from(
    rendered.container.querySelectorAll('[data-authorized-media-state="decoding"] img'),
  )) {
    fireEvent.load(img);
  }
  await waitFor(() => {
    expect(screen.getAllByRole("button", { name: /Agrandir/ }).length).toBe(expectedTiles);
  });
  return rendered;
}

const counterText = (): string | null =>
  document.querySelector("[data-feed-media-viewer-counter]")?.textContent?.trim() ?? null;

const nextButton = () => screen.getByRole("button", { name: "Photo suivante" });
const previousButton = () => screen.getByRole("button", { name: "Photo précédente" });

describe("lot de DIX photos", () => {
  it("1 — quatre tuiles, badge « +6 », et SIX photos jamais chargées", async () => {
    const rendered = await renderAndOpenTiles(batch(10), 4);

    const badge = rendered.container.querySelector("[data-publication-media-overflow]");
    expect(badge?.getAttribute("data-publication-media-overflow")).toBe("6");

    // Le plafond visible tient, ET rien d'invisible n'est payé.
    expect(requestedUrls()).toEqual([photo(1), photo(2), photo(3), photo(4)]);
  });

  it("2 — la CINQUIÈME est atteinte depuis la quatrième tuile, et résolue À CE MOMENT", async () => {
    await renderAndOpenTiles(batch(10), 4);

    // La quatrième tuile est celle qui porte le badge : c'est par elle que
    // passe le seul chemin vers la suite.
    fireEvent.click(screen.getAllByRole("button", { name: /Agrandir/ })[3]!);
    await waitFor(() => expect(counterText()).toBe("4 / 10"));
    expect(requestedUrls()).toEqual([photo(1), photo(2), photo(3), photo(4)]);

    fireEvent.click(nextButton());
    await waitFor(() => expect(counterText()).toBe("5 / 10"));
    // La cinquième n'est demandée QU'ICI — pas à l'ouverture de la grille.
    await waitFor(() => expect(requestedUrls()).toContain(photo(5)));
    expect(requestedUrls().filter((url) => url === photo(5))).toHaveLength(1);
  });

  it("3 — la DERNIÈRE est atteinte, et l'ordre de parcours est respecté", async () => {
    await renderAndOpenTiles(batch(10), 4);
    fireEvent.click(screen.getAllByRole("button", { name: /Agrandir/ })[3]!);
    await waitFor(() => expect(counterText()).toBe("4 / 10"));

    for (let rank = 5; rank <= 10; rank += 1) {
      fireEvent.keyDown(document, { key: "ArrowRight" });
      await waitFor(() => expect(counterText()).toBe(`${rank} / 10`));
    }

    // Les six photos cachées ont été résolues DANS L'ORDRE, et une seule fois.
    const afterOpening = requestedUrls().slice(4);
    expect(afterOpening).toEqual([photo(5), photo(6), photo(7), photo(8), photo(9), photo(10)]);

    // Borne haute : « suivant » est annoncé inactif, reste atteignable, et son
    // clic ne déborde pas de la liste.
    const next = nextButton();
    expect(next.getAttribute("aria-disabled")).toBe("true");
    expect(next.hasAttribute("disabled")).toBe(false);
    fireEvent.click(next);
    await waitFor(() => expect(counterText()).toBe("10 / 10"));
    expect(requestedUrls().slice(4)).toEqual(afterOpening);
  });

  it("4 — le parcours revient en arrière, et ne déborde pas de ses bornes", async () => {
    await renderAndOpenTiles(batch(10), 4);
    fireEvent.click(screen.getAllByRole("button", { name: /Agrandir/ })[0]!);
    await waitFor(() => expect(counterText()).toBe("1 / 10"));

    /**
     * Borne basse : le bouton est annoncé inactif, mais reste ATTEIGNABLE.
     *
     * `disabled` aurait retiré le bouton de l'ordre de tabulation et fait
     * retomber le focus sur `<body>` dès la borne atteinte. Avec
     * `aria-disabled`, le focus reste utilisable — et l'action, elle, est
     * bel et bien empêchée : ni le clic, ni la flèche ne déplacent le rang.
     */
    const previous = previousButton();
    expect(previous.getAttribute("aria-disabled")).toBe("true");
    expect(previous.hasAttribute("disabled")).toBe(false);

    // Le dialogue prend son focus initial dans une frame d'animation. L'attendre
    // avant de déplacer le focus soi-même : sans cela, il le reprendrait au
    // milieu du scénario, et le test mesurerait cette course au lieu du
    // comportement des bornes.
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Fermer l’image" })),
    );

    previous.focus();
    expect(document.activeElement).toBe(previous);

    fireEvent.click(previous);
    await waitFor(() => expect(counterText()).toBe("1 / 10"));
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    await waitFor(() => expect(counterText()).toBe("1 / 10"));
    // Le focus n'a pas été perdu par l'atteinte de la borne.
    expect(document.activeElement).toBe(previous);

    fireEvent.click(nextButton());
    await waitFor(() => expect(counterText()).toBe("2 / 10"));
    fireEvent.click(previousButton());
    await waitFor(() => expect(counterText()).toBe("1 / 10"));
  });

  it("5 — le compteur est ANNONCÉ sans voler le focus", async () => {
    await renderAndOpenTiles(batch(10), 4);
    fireEvent.click(screen.getAllByRole("button", { name: /Agrandir/ })[0]!);
    await waitFor(() => expect(counterText()).toBe("1 / 10"));

    const region = document.querySelector("[data-feed-media-viewer-counter]");
    expect(region?.getAttribute("role")).toBe("status");
    expect(region?.getAttribute("aria-live")).toBe("polite");
  });
});

describe("bornes du parcours et non-régressions", () => {
  it("6 — UNE seule photo : aucune commande, aucun compteur", async () => {
    const rendered = render(
      <>
        <FeedPublicationMedia mediaUrl={photo(1)} label="Reims" />
        <FeedMediaViewerHost />
      </>,
    );
    await waitFor(() => {
      expect(
        rendered.container.querySelector('[data-authorized-media-state="decoding"] img'),
      ).not.toBeNull();
    });
    fireEvent.load(rendered.container.querySelector('[data-authorized-media-state="decoding"] img')!);

    const trigger = await screen.findByRole("button", { name: /Agrandir/ });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(document.querySelector("[data-feed-media-viewer]")).not.toBeNull();
    });
    expect(counterText()).toBeNull();
    expect(screen.queryByRole("button", { name: "Photo suivante" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Photo précédente" })).toBeNull();
  });

  it("7 — la VIDÉO n'entre PAS dans le parcours", async () => {
    /**
     * ⛔ Son rendu garde sa limite documentée — URL brute, hors résolution
     * autorisée — et n'est PAS présenté comme validé. L'exclure du parcours
     * évite d'offrir une navigation vers un média qui ne se chargerait pas.
     */
    const rendered = render(
      <>
        <FeedPublicationMedia
          mediaUrls={[photo(1), `${BASE}/clip.mp4`, photo(2)]}
          label="Reims"
        />
        <FeedMediaViewerHost />
      </>,
    );
    await waitFor(() => {
      expect(
        rendered.container.querySelectorAll('[data-authorized-media-state="decoding"] img').length,
      ).toBe(2);
    });
    for (const img of Array.from(
      rendered.container.querySelectorAll('[data-authorized-media-state="decoding"] img'),
    )) {
      fireEvent.load(img);
    }

    const triggers = await screen.findAllByRole("button", { name: /Agrandir/ });
    fireEvent.click(triggers[0]!);

    // Deux photos dans la publication, donc « 1 / 2 » — la vidéo est hors liste.
    await waitFor(() => expect(counterText()).toBe("1 / 2"));
    fireEvent.click(nextButton());
    await waitFor(() => expect(counterText()).toBe("2 / 2"));

    /**
     * ⚠️ LIMITE ASSUMÉE, et mesurée ici plutôt que masquée.
     *
     * `photo-2` est AUSSI une tuile visible, donc déjà résolue. La consulter
     * dans la visionneuse la résout une SECONDE fois : le blob d'une tuile lui
     * appartient, et seul celui du média TOUCHÉ est partagé à l'ouverture.
     *
     * Le coût est d'UN appel par déplacement — jamais d'un préchargement des
     * dix fichiers, qui est la dépense que la consigne écarte. Un cache
     * partagé par URL de média toucherait la propriété des blobs
     * (MEDIA-01B) : c'est une décision à part.
     */
    expect(requestedUrls()).toEqual([photo(1), photo(2), photo(2)]);
  });

  it("8 — la fermeture rend le focus à la tuile touchée", async () => {
    await renderAndOpenTiles(batch(10), 4);
    const tile = screen.getAllByRole("button", { name: /Agrandir/ })[1]!;
    fireEvent.click(tile);
    await waitFor(() => expect(counterText()).toBe("2 / 10"));

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(document.querySelector("[data-feed-media-viewer]")).toBeNull();
    });
    await waitFor(() => expect(document.activeElement).toBe(tile));
  });

  it("11 — deux tuiles d'un MÊME fichier ouvrent chacune son PROPRE rang", async () => {
    /**
     * Le rang est pris à la POSITION du média dans la liste, et non par
     * recherche de son URL : une recherche rendrait le rang de la PREMIÈRE
     * occurrence, et la seconde tuile ouvrirait le parcours au mauvais
     * endroit — « 1 / 3 » au lieu de « 2 / 3 ».
     *
     * Le fil dédoublonne côté serveur, donc ce cas ne vient pas de l'API ;
     * il vient du harnais E2E, qui alimente le composant en direct.
     */
    await renderAndOpenTiles([photo(1), photo(1), photo(2)], 3);

    fireEvent.click(screen.getAllByRole("button", { name: /Agrandir/ })[1]!);
    await waitFor(() => expect(counterText()).toBe("2 / 3"));

    fireEvent.click(nextButton());
    await waitFor(() => expect(counterText()).toBe("3 / 3"));
  });
});

describe("échec de chargement et navigation rapide", () => {
  /**
   * Ces deux cas partagent une cause : la visionneuse résout À LA DEMANDE.
   * Une résolution peut donc échouer, et une autre peut revenir APRÈS qu'on
   * a déjà changé de photo. Les deux doivent se voir, et aucune ne doit
   * mentir sur ce qui est affiché.
   */

  /** Promesses retenues par URL, pour décider QUAND chacune revient. */
  function deferResolutions() {
    const pending = new Map<
      string,
      { resolve: (valeur: { blob: Blob }) => void; reject: (raison: unknown) => void }
    >();
    fetchAuthorizedMediaBlob.mockImplementation(
      (url: string) =>
        new Promise((resolve, reject) => {
          pending.set(url, { resolve, reject });
        }),
    );
    return pending;
  }

  const mediaState = (): string | null =>
    document
      .querySelector("[data-feed-media-viewer] [data-authorized-media-state]")
      ?.getAttribute("data-authorized-media-state") ?? null;

  it("9 — une photo qui ÉCHOUE affiche l'erreur, propose de réessayer, et ne bloque pas le parcours", async () => {
    const pending = deferResolutions();
    const rendered = render(
      <>
        <FeedPublicationMedia mediaUrls={batch(10)} label="Reims" />
        <FeedMediaViewerHost />
      </>,
    );

    // Les quatre tuiles aboutissent normalement.
    await waitFor(() => expect(pending.size).toBe(4));
    for (const rank of [1, 2, 3, 4]) {
      pending.get(photo(rank))!.resolve({ blob: new Blob(["ok"]) });
    }
    await waitFor(() => {
      expect(
        rendered.container.querySelectorAll('[data-authorized-media-state="decoding"] img').length,
      ).toBe(4);
    });
    for (const img of Array.from(
      rendered.container.querySelectorAll('[data-authorized-media-state="decoding"] img'),
    )) {
      fireEvent.load(img);
    }
    const triggers = await screen.findAllByRole("button", { name: /Agrandir/ });

    fireEvent.click(triggers[3]!);
    await waitFor(() => expect(counterText()).toBe("4 / 10"));

    // La cinquième est demandée… et refusée.
    fireEvent.click(nextButton());
    await waitFor(() => expect(counterText()).toBe("5 / 10"));
    await waitFor(() => expect(pending.has(photo(5))).toBe(true));
    pending.get(photo(5))!.reject(new Error("réseau indisponible"));

    // L'échec est MONTRÉ — pas un cadre vide, pas une photo d'avant.
    await waitFor(() => expect(mediaState()).toBe("error"));
    expect(
      document.querySelector("[data-feed-media-viewer] [data-authorized-media-retry]"),
    ).not.toBeNull();
    // Et le rang reste juste : l'erreur ne fait pas reculer le parcours.
    expect(counterText()).toBe("5 / 10");

    // Le parcours CONTINUE : la sixième se charge normalement.
    fireEvent.click(nextButton());
    await waitFor(() => expect(counterText()).toBe("6 / 10"));
    await waitFor(() => expect(pending.has(photo(6))).toBe(true));
    pending.get(photo(6))!.resolve({ blob: new Blob(["ok"]) });
    await waitFor(() => expect(mediaState()).not.toBe("error"));
  });

  it("10 — une réponse EN RETARD ne s'affiche pas à la place de la photo courante", async () => {
    /**
     * Navigation rapide : on quitte la cinquième avant sa réponse. Si la
     * réponse tardive s'affichait, l'écran montrerait la photo 5 sous le
     * compteur « 6 / 10 » — un mensonge silencieux.
     */
    const pending = deferResolutions();
    const rendered = render(
      <>
        <FeedPublicationMedia mediaUrls={batch(10)} label="Reims" />
        <FeedMediaViewerHost />
      </>,
    );
    await waitFor(() => expect(pending.size).toBe(4));
    for (const rank of [1, 2, 3, 4]) {
      pending.get(photo(rank))!.resolve({ blob: new Blob(["ok"]) });
    }
    await waitFor(() => {
      expect(
        rendered.container.querySelectorAll('[data-authorized-media-state="decoding"] img').length,
      ).toBe(4);
    });
    for (const img of Array.from(
      rendered.container.querySelectorAll('[data-authorized-media-state="decoding"] img'),
    )) {
      fireEvent.load(img);
    }
    const triggers = await screen.findAllByRole("button", { name: /Agrandir/ });
    fireEvent.click(triggers[3]!);
    await waitFor(() => expect(counterText()).toBe("4 / 10"));

    // Trois déplacements d'affilée, sans attendre aucune réponse.
    fireEvent.keyDown(document, { key: "ArrowRight" });
    fireEvent.keyDown(document, { key: "ArrowRight" });
    fireEvent.keyDown(document, { key: "ArrowRight" });
    await waitFor(() => expect(counterText()).toBe("7 / 10"));

    // La cinquième répond MAINTENANT, alors qu'on est sur la septième.
    pending.get(photo(5))!.resolve({ blob: new Blob(["retard"]) });
    // Puis la septième, la seule attendue.
    await waitFor(() => expect(pending.has(photo(7))).toBe(true));
    pending.get(photo(7))!.resolve({ blob: new Blob(["courante"]) });

    // jsdom n'émet pas `load` : la visionneuse resterait en décodage sans ce
    // coup de pouce, exactement comme pour les tuiles.
    await waitFor(() => {
      expect(
        document.querySelector('[data-feed-media-viewer] [data-authorized-media-state="decoding"] img'),
      ).not.toBeNull();
    });
    fireEvent.load(
      document.querySelector(
        '[data-feed-media-viewer] [data-authorized-media-state="decoding"] img',
      )!,
    );

    await waitFor(() => {
      const displayed = document.querySelector(
        '[data-feed-media-viewer] [data-authorized-media-state="ready"]',
      );
      expect(displayed?.getAttribute("alt")).toBe("Reims (7)");
    });
    expect(counterText()).toBe("7 / 10");
    // Aucune trace de la photo abandonnée.
    expect(
      document.querySelector('[data-feed-media-viewer] img[alt="Reims (5)"]'),
    ).toBeNull();
  });
});
