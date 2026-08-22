/**
 * C3-FEED-M5.1 — branche « rail long » de la région Stories (640 px).
 *
 * ── Pourquoi cette spec existe séparément ────────────────────────────────────
 * `25-medium-feed-stories.spec.ts` prouve la composition sur le VRAI `/feed`,
 * mais la baseline QA canonique ne produit qu'un seul raccourci (0 story, 0
 * adhésion tribu, 0 lieu `is_featured`, aucun event « ce soir ») : le rail ne
 * déborde donc jamais et la branche `overflow` de la règle
 * `width: max-content; margin-inline: auto` restait NON PROUVÉE.
 *
 * ── Méthode ──────────────────────────────────────────────────────────────────
 * Aucune donnée fictive n'est injectée dans QA, aucun seed n'est touché, aucune
 * route de test n'existe dans le produit. Le VRAI composant `FeedStoriesRail`
 * est compilé par esbuild (déjà présent, aucune dépendance ajoutée) puis monté
 * dans une PAGE RÉELLE de l'application — donc sous la FEUILLE DE STYLE RÉELLE
 * produite par `next build`. Les sept raccourcis sont typés par le contrat
 * autoritaire `FeedStoryShortcut` et correspondent au plafond réel de
 * `buildFeedStoryShortcuts` (`maxItems = 7`).
 *
 * Le test s'assure lui-même que le CSS réel est bien appliqué (diamètre de
 * pastille au palier 640) : sans cette vérification, la preuve serait creuse.
 *
 * Cette spec n'utilise PAS la fixture authentifiée : elle ne consomme aucune
 * inscription sur le quota QA (5/IP/h).
 */
import { build } from "esbuild";
import { expect, test } from "@playwright/test";

/** Largeur de colonne mesurée sur le vrai `/feed` à 640 px (relevé C3-FEED-M5). */
const COLONNE_640_PX = 552;
/** Palier de pastille imposé sur 640–767 px. */
const PASTILLE_640 = 74;
const RACINE = "yn-long-rail-root";

const RAIL = "[data-feed-medium-stories-rail]";
const ITEM = "[data-feed-medium-stories-item]";
const CIRCLE = "[data-feed-medium-stories-circle]";
const CTA = "[data-feed-medium-stories-cta]";

let bundleCache: string | null = null;

/**
 * esbuild lit le `.tsx` DEPUIS LE DISQUE : le composant échappe ainsi au
 * transform JSX de Playwright, qui réécrit tout le graphe d'import d'un fichier
 * de test en objets `__pw_type` inutilisables par React.
 */
async function bundleRail(): Promise<string> {
  if (bundleCache) return bundleCache;
  const out = await build({
    entryPoints: ["e2e/harness/long-rail-mount.tsx"],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    tsconfig: "tsconfig.json",
    define: { "process.env.NODE_ENV": '"production"' },
    // Le bundle est charge hors runtime Next : `process` n'existe pas dans la page.
    banner: { js: 'var process = { env: { NODE_ENV: "production" } };' },
    logLevel: "silent",
  });
  bundleCache = out.outputFiles[0]!.text;
  return bundleCache;
}

/** Reproduit la chaîne d'ancêtres RÉELLE de la région (cf. feed-portal-screen). */
const GABARIT = `
<div class="citizen-medium-shell" data-yn-long-rail-host="">
  <div class="feed-medium-column feed-medium-editorial-grid" style="width:${COLONNE_640_PX}px">
    <div
      data-feed-medium-region="stories"
      data-feed-medium-surface="primary"
      class="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
    >
      <div class="border-b border-neutral-100 px-4 py-5 sm:px-6">
        <h2 class="feed-medium-stories-title text-sm font-bold text-neutral-900">Moments</h2>
        <div id="${RACINE}"></div>
      </div>
    </div>
  </div>
</div>`;

/**
 * Insere le gabarit reel de la region avant le chargement du bundle. Le HTML est
 * une constante du test — aucune entree externe n'y transite.
 */
async function monter(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(
    ({ gabarit, racine }) => {
      // Neutralise le reste de la page pour que la mesure de débordement
      // horizontal porte sur la seule région Stories.
      for (const enfant of [...document.body.children]) {
        (enfant as HTMLElement).style.display = "none";
      }
      document.body.insertAdjacentHTML("beforeend", gabarit);
      if (!document.getElementById(racine)) throw new Error("racine de montage absente");
    },
    { gabarit: GABARIT, racine: RACINE },
  );
}

test.describe("C3-FEED-M5.1 — rail Stories long (débordement)", () => {
  test("640 — sept raccourcis : une seule ligne, débordement interne, extrémités atteignables", async ({
    page,
  }) => {
    const erreurs: string[] = [];
    page.on("pageerror", (e) => erreurs.push(String(e)));
    page.on("console", (msg) => {
      // Le bruit reseau de la page publique (401 sur les appels de session) n'est
      // pas une erreur de montage : seules les exceptions JS comptent ici.
      if (msg.type() === "error" && !msg.text().includes("Failed to load resource")) {
        erreurs.push(msg.text());
      }
    });

    await page.setViewportSize({ width: 640, height: 900 });
    // Page publique de l'application : la feuille de style est celle du build.
    await page.goto("/login");

    await monter(page);

    await page.addScriptTag({ content: await bundleRail() });

    // Montage React concurrent : on attend l'état réel du DOM, sans pause.
    await expect
      .poll(async () => `${await page.locator(ITEM).count()} items | erreurs : ${erreurs.join(" || ") || "aucune"}`)
      .toBe("7 items | erreurs : aucune");

    const m = await page.evaluate(
      (sel) => {
        const rail = document.querySelector(sel.rail) as HTMLElement;
        const ul = rail.querySelector("ul") as HTMLElement;
        const items = [...rail.querySelectorAll(sel.item)] as HTMLElement[];
        const cta = rail.querySelector(sel.cta) as HTMLElement;
        const cs = getComputedStyle(rail);
        const padL = parseFloat(cs.paddingLeft || "0");
        const padR = parseFloat(cs.paddingRight || "0");
        return {
          // Le CSS réel est-il appliqué ? Sinon la preuve ne vaut rien.
          pastille: Math.round(
            items[0]!.querySelector(sel.circle)!.getBoundingClientRect().width,
          ),
          itemLargeur: Math.round(items[0]!.getBoundingClientRect().width),
          clientWidth: rail.clientWidth,
          scrollWidth: rail.scrollWidth,
          scrollLeft: rail.scrollLeft,
          flexWrap: getComputedStyle(ul).flexWrap,
          // Une seule ligne : tous les items partagent le même sommet.
          sommets: [...new Set(items.map((el) => Math.round(el.getBoundingClientRect().top)))],
          hauteurUl: Math.round(ul.getBoundingClientRect().height),
          // Les items n'ont pas tous la meme hauteur : « Votre story » porte UN
          // libelle, une tribu/event/lieu en porte DEUX. C'est le comportement
          // d'origine (`items-start`), inchange par M5.
          hauteurItemMax: Math.max(
            ...items.map((el) => Math.round(el.getBoundingClientRect().height)),
          ),
          ordre: items.map((el) => (el.getAttribute("href") ?? "").trim()),
          libelles: items.map((el) => (el.textContent ?? "").replace(/\s+/g, " ").trim()),
          ctaEstDernier: ul.lastElementChild?.contains(cta) === true,
          enfantsUl: ul.children.length,
          padL,
          padR,
          debordementPage:
            document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        };
      },
      { rail: RAIL, item: ITEM, circle: CIRCLE, cta: CTA },
    );

    // Relevé joint au rapport de test : la géométrie exacte reste consultable
    // sans réinstrumenter la spec.
    await test.info().attach("releve-rail-long.json", {
      body: JSON.stringify(m, null, 2),
      contentType: "application/json",
    });

    // — Le CSS réel s'applique bien (sinon tout le reste est creux) —
    expect(m.pastille, "le CSS medium réel ne s'applique pas au montage isolé").toBe(PASTILLE_640);
    expect(m.itemLargeur, "largeur d'item hors palier 640").toBe(116);

    // — Débordement réel —
    expect(
      m.scrollWidth,
      `rail non débordant : scrollWidth ${m.scrollWidth} ≤ clientWidth ${m.clientWidth}`,
    ).toBeGreaterThan(m.clientWidth);
    expect(m.scrollLeft, "le rail est déjà défilé au montage").toBe(0);

    // — Aucune ligne supplémentaire —
    expect(m.flexWrap, "le rail est autorisé à passer à la ligne").toBe("nowrap");
    expect(m.sommets.length, `items répartis sur ${m.sommets.length} lignes`).toBe(1);
    expect(
      m.hauteurUl - m.hauteurItemMax,
      "la liste est plus haute que son item le plus haut : seconde ligne",
    ).toBeLessThanOrEqual(2);

    // — Aucun débordement horizontal de la PAGE —
    expect(m.debordementPage, "la région Stories fait déborder la page").toBe(false);

    // — Ordre DOM et absence de duplication —
    expect(m.ordre, "ordre DOM altéré").toEqual([
      "/stories/new",
      "/t/1",
      "/t/2",
      "/t/3",
      "/e/1",
      "/e/2",
      "/p/1",
    ]);
    expect(new Set(m.libelles).size, `libellés dupliqués : ${m.libelles.join(" | ")}`).toBe(7);
    expect(m.enfantsUl, "la liste ne contient pas exactement 7 items + le relais").toBe(8);
    expect(m.ctaEstDernier, "le relais « voir tout » n'est plus en dernier").toBe(true);

    // — Premier item entièrement atteignable, défilement à gauche —
    const gauche = await page.evaluate(
      (sel) => {
        const rail = document.querySelector(sel.rail) as HTMLElement;
        rail.scrollLeft = 0;
        const r = rail.getBoundingClientRect();
        const cs = getComputedStyle(rail);
        const premier = rail.querySelector(sel.item)!.getBoundingClientRect();
        return {
          debut: premier.left - (r.left + parseFloat(cs.paddingLeft || "0")),
          fin: r.right - parseFloat(cs.paddingRight || "0") - premier.right,
        };
      },
      { rail: RAIL, item: ITEM },
    );
    expect(gauche.debut, "premier item hors d'atteinte au scroll gauche").toBeGreaterThanOrEqual(
      -1,
    );
    expect(gauche.fin, "premier item tronqué à droite au scroll gauche").toBeGreaterThanOrEqual(-1);

    // — Dernier élément entièrement atteignable, défilement à droite —
    const droite = await page.evaluate(
      (sel) => {
        const rail = document.querySelector(sel.rail) as HTMLElement;
        rail.scrollLeft = rail.scrollWidth;
        const r = rail.getBoundingClientRect();
        const cs = getComputedStyle(rail);
        const dernier = rail.querySelector(sel.cta)!.getBoundingClientRect();
        return {
          scrollLeft: rail.scrollLeft,
          debut: dernier.left - (r.left + parseFloat(cs.paddingLeft || "0")),
          fin: r.right - parseFloat(cs.paddingRight || "0") - dernier.right,
        };
      },
      { rail: RAIL, cta: CTA },
    );
    expect(droite.scrollLeft, "le rail ne défile pas").toBeGreaterThan(0);
    expect(droite.fin, "dernier élément hors d'atteinte au scroll droit").toBeGreaterThanOrEqual(
      -1,
    );
    expect(droite.debut, "dernier élément tronqué à gauche au scroll droit").toBeGreaterThanOrEqual(
      -1,
    );

    await test.info().attach("releve-extremites.json", {
      body: JSON.stringify({ gauche, droite }, null, 2),
      contentType: "application/json",
    });
  });

  test("640 — focus et ordre clavier preserves sur un rail long", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto("/login");
    await monter(page);
    await page.addScriptTag({ content: await bundleRail() });
    await expect.poll(async () => page.locator(ITEM).count()).toBe(7);

    // — Contrat structurel : rien ne detourne l'ordre de focus —
    const structure = await page.evaluate(
      (sel) => {
        const rail = document.querySelector(sel.rail) as HTMLElement;
        const cibles = [...rail.querySelectorAll(`${sel.item}, ${sel.cta}`)] as HTMLElement[];
        return {
          total: cibles.length,
          liens: cibles.filter((el) => el.tagName === "A" && el.hasAttribute("href")).length,
          tabindexExplicites: cibles.filter((el) => el.hasAttribute("tabindex")).length,
          ariaHidden: cibles.filter((el) => el.getAttribute("aria-hidden") === "true").length,
        };
      },
      { rail: RAIL, item: ITEM, cta: CTA },
    );
    expect(structure.total, "cibles focalisables manquantes").toBe(8);
    expect(structure.liens, "une cible n'est pas un lien reel").toBe(8);
    expect(structure.tabindexExplicites, "un `tabindex` detourne l'ordre naturel").toBe(0);
    expect(structure.ariaHidden, "une cible focalisable est masquee aux technologies").toBe(0);

    // — Contrat universel : chaque cible prend reellement le focus, dans l'ordre
    //   du DOM, y compris celles hors du champ visible (le rail defile) —
    const focalisation = await page.evaluate(
      (sel) => {
        const rail = document.querySelector(sel.rail) as HTMLElement;
        const cibles = [...rail.querySelectorAll(`${sel.item}, ${sel.cta}`)] as HTMLElement[];
        rail.scrollLeft = 0;
        const obtenus: string[] = [];
        let scrollFinal = 0;
        let dernierVisible = false;
        for (const cible of cibles) {
          cible.focus();
          obtenus.push(
            document.activeElement === cible ? cible.getAttribute("href") ?? "" : "NON-FOCALISE",
          );
        }
        scrollFinal = rail.scrollLeft;
        const visible = () => {
          const r = rail.getBoundingClientRect();
          const a = (document.activeElement as HTMLElement).getBoundingClientRect();
          return a.right <= r.right + 1 && a.left >= r.left - 1;
        };
        const autoDefilement = scrollFinal > 0 && visible();
        // Si le moteur ne defile pas de lui-meme au focus programmatique
        // (comportement WebKit), l'element doit rester ATTEIGNABLE : c'est le
        // seul contrat que le produit possede reellement.
        (document.activeElement as HTMLElement).scrollIntoView({ inline: "nearest" });
        dernierVisible = visible();
        return { obtenus, scrollFinal, autoDefilement, dernierVisible, defilable: rail.scrollWidth > rail.clientWidth };
      },
      { rail: RAIL, item: ITEM, cta: CTA },
    );
    expect(focalisation.obtenus, "ordre de focus different de l'ordre DOM").toEqual([
      "/stories/new",
      "/t/1",
      "/t/2",
      "/t/3",
      "/e/1",
      "/e/2",
      "/p/1",
      "/stories",
    ]);
    expect(focalisation.defilable, "le rail long n'est plus defilable").toBe(true);
    expect(
      focalisation.dernierVisible,
      "l'element focalise ne peut pas etre amene dans le champ visible",
    ).toBe(true);
    test.info().annotations.push({
      type: "auto-defilement-au-focus",
      description: focalisation.autoDefilement
        ? "le moteur amene de lui-meme l'element focalise dans le champ"
        : "le moteur ne defile pas au focus programmatique (WebKit) — atteignabilite verifiee explicitement",
    });

    // — Contrat de tabulation : verifie sur les moteurs qui placent les liens
    //   dans la sequence de focus. WebKit ne le fait pas par defaut (preference
    //   Safari « Press Tab to highlight each item »), ce qui ne depend pas de
    //   notre balisage : le cas est DETECTE puis rapporte, jamais masque. —
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.keyboard.press("Tab");
    const premierTab = await page.evaluate(
      (sel) =>
        (document.activeElement as HTMLElement)?.closest(sel.item) !== null
          ? (document.activeElement as HTMLElement).getAttribute("href")
          : null,
      { item: ITEM },
    );

    const tabulationExposee = premierTab === "/stories/new";
    test.info().annotations.push({
      type: "tabulation-sequentielle",
      description: tabulationExposee
        ? "moteur : liens dans la sequence de focus — ordre verifie"
        : "moteur : liens hors sequence de focus par defaut (WebKit) — contrat couvert par la focalisation programmatique",
    });

    if (tabulationExposee) {
      const parcours: string[] = ["/stories/new"];
      for (let i = 0; i < 7; i += 1) {
        await page.keyboard.press("Tab");
        parcours.push(
          await page.evaluate(
            () => (document.activeElement as HTMLElement)?.getAttribute("href") ?? "",
          ),
        );
      }
      expect(parcours, "ordre de tabulation different de l'ordre DOM").toEqual([
        "/stories/new",
        "/t/1",
        "/t/2",
        "/t/3",
        "/e/1",
        "/e/2",
        "/p/1",
        "/stories",
      ]);
    }
  });
});
