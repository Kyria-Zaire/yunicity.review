import { describe, expect, it } from "vitest";

import {
  SEARCH_POST_EMPTY_LABEL,
  SEARCH_POST_EXCERPT_MAX_LENGTH,
  buildSearchPostCard,
  normalizeSearchPostText,
  searchPostExcerpt,
} from "./search-post-card";

const segmenter = new Intl.Segmenter("fr", { granularity: "grapheme" });
const graphemeCount = (text: string) => Array.from(segmenter.segment(text)).length;
/** Vrai si une moitié de paire de substitution est isolée (caractère coupé en deux). */
const hasLoneSurrogate = (text: string) =>
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text);

describe("normalizeSearchPostText", () => {
  it("collapses line breaks, tabs and non-breaking spaces into single spaces", () => {
    expect(normalizeSearchPostText("  Samedi :\n\nbrocante\t rue de Vesle.\r\n- fin  ")).toBe(
      "Samedi : brocante rue de Vesle. - fin",
    );
  });

  it("returns an empty string for null, undefined and whitespace-only values", () => {
    expect(normalizeSearchPostText(null)).toBe("");
    expect(normalizeSearchPostText(undefined)).toBe("");
    expect(normalizeSearchPostText(" \n\t ")).toBe("");
  });
});

describe("searchPostExcerpt", () => {
  it("returns null when there is no text", () => {
    expect(searchPostExcerpt(null)).toBeNull();
    expect(searchPostExcerpt("   \n  ")).toBeNull();
  });

  it("keeps a short text untouched, without ellipsis", () => {
    expect(searchPostExcerpt("Marché de Noël ce soir place d'Erlon !")).toBe(
      "Marché de Noël ce soir place d'Erlon !",
    );
  });

  it("keeps a text of exactly the maximum length without ellipsis", () => {
    const text = "a".repeat(SEARCH_POST_EXCERPT_MAX_LENGTH);
    expect(searchPostExcerpt(text)).toBe(text);
  });

  it("cuts a long text on a word boundary and ends with an ellipsis", () => {
    const text = Array.from({ length: 80 }, (_, i) => `mot${i}`).join(" ");
    const excerpt = searchPostExcerpt(text) ?? "";
    expect(excerpt.endsWith("…")).toBe(true);
    expect(graphemeCount(excerpt)).toBeLessThanOrEqual(SEARCH_POST_EXCERPT_MAX_LENGTH);
    const words = excerpt.slice(0, -1).split(" ");
    expect(text.split(" ").slice(0, words.length)).toEqual(words);
  });

  it("hard-cuts a word without spaces, within the limit", () => {
    const excerpt = searchPostExcerpt(`Bravo ${"anticonstitutionnellement".repeat(20)}`) ?? "";
    expect(excerpt.endsWith("…")).toBe(true);
    expect(graphemeCount(excerpt)).toBe(SEARCH_POST_EXCERPT_MAX_LENGTH);
    expect(excerpt.startsWith("Bravo anticonstitutionnellement")).toBe(true);
  });

  it("hard-cuts a long link and keeps it as plain text", () => {
    const link = `https://example.invalid/${"chemin-tres-long/".repeat(30)}`;
    const excerpt = searchPostExcerpt(`Infos : ${link}`) ?? "";
    expect(excerpt.startsWith("Infos : https://example.invalid/chemin")).toBe(true);
    expect(graphemeCount(excerpt)).toBeLessThanOrEqual(SEARCH_POST_EXCERPT_MAX_LENGTH);
  });

  it("never splits an emoji, a flag, a ZWJ sequence or a decomposed accent", () => {
    const cases = [
      "😀".repeat(400),
      `${"a".repeat(278)}😀😀😀`,
      "👨‍👩‍👧 ".repeat(200),
      "🇫🇷".repeat(300),
      "👍🏽".repeat(300),
      "é".repeat(300),
    ];
    for (const text of cases) {
      const excerpt = searchPostExcerpt(text) ?? "";
      expect(hasLoneSurrogate(excerpt)).toBe(false);
      expect(excerpt.endsWith("…")).toBe(true);
      expect(graphemeCount(excerpt)).toBeLessThanOrEqual(SEARCH_POST_EXCERPT_MAX_LENGTH);
      const body = excerpt.slice(0, -1).trimEnd();
      expect(text.startsWith(body)).toBe(true);
      // Le dernier graphème gardé est un graphème entier du texte source.
      const kept = Array.from(segmenter.segment(body), (s) => s.segment);
      const source = Array.from(segmenter.segment(text), (s) => s.segment);
      expect(kept).toEqual(source.slice(0, kept.length));
    }
  });

  it("counts visible characters, not UTF-16 units, for short emoji texts", () => {
    const text = "🎄".repeat(200);
    expect(searchPostExcerpt(text)).toBe(text);
  });

  it("returns HTML-looking text verbatim (plain string, nothing interpreted)", () => {
    const html = '<b>gras</b> <img src=x onerror="x()"> &amp; <script>y()</script>';
    expect(searchPostExcerpt(html)).toBe(html);
  });
});

describe("buildSearchPostCard", () => {
  it("shows title, city and excerpt when both title and text exist", () => {
    expect(
      buildSearchPostCard({ title: " Programme ", body: "Samedi :\nbrocante.", city: "Reims" }, "Paris"),
    ).toEqual({ title: "Programme", excerpt: "Samedi : brocante.", emptyLabel: null, meta: "Reims" });
  });

  it("uses the excerpt as main content when there is no title (no « Sans titre »)", () => {
    const card = buildSearchPostCard({ title: null, body: "Marché ce soir", city: null }, "Reims");
    expect(card).toEqual({ title: null, excerpt: "Marché ce soir", emptyLabel: null, meta: "Reims" });
  });

  it("treats a whitespace-only title as absent", () => {
    expect(buildSearchPostCard({ title: "  \n ", body: "Texte", city: "Reims" }, "").title).toBeNull();
  });

  it("shows the title alone when the text is missing, without the empty label", () => {
    expect(buildSearchPostCard({ title: "Coucher de soleil", body: null, city: "Reims" }, "")).toEqual({
      title: "Coucher de soleil",
      excerpt: null,
      emptyLabel: null,
      meta: "Reims",
    });
  });

  it("shows the neutral label only when title and text are both missing or blank", () => {
    for (const [title, body] of [
      [null, null],
      ["   ", "  \n "],
      [null, "   \n  "],
      ["", ""],
    ] as const) {
      const card = buildSearchPostCard({ title, body, city: "Reims" }, "");
      expect(card.emptyLabel).toBe(SEARCH_POST_EMPTY_LABEL);
      expect(card.title).toBeNull();
      expect(card.excerpt).toBeNull();
    }
  });

  it("does not repeat the title when the text is the same as the title", () => {
    const card = buildSearchPostCard({ title: "Fête du quartier", body: " fête  du\nquartier ", city: "Reims" }, "");
    expect(card).toMatchObject({ title: "Fête du quartier", excerpt: null, emptyLabel: null });
  });

  it("drops a first line that repeats the title", () => {
    const card = buildSearchPostCard(
      { title: "Programme du week-end", body: "Programme du week-end\nSamedi : brocante.", city: "Reims" },
      "",
    );
    expect(card.excerpt).toBe("Samedi : brocante.");
  });

  it("keeps a text that merely starts with the title words", () => {
    const card = buildSearchPostCard({ title: "Programme", body: "Programme du week-end chargé", city: "Reims" }, "");
    expect(card.excerpt).toBe("Programme du week-end chargé");
  });

  it("falls back to the search city, and to an empty meta when none is known", () => {
    expect(buildSearchPostCard({ title: "T", body: null, city: "  " }, "Reims").meta).toBe("Reims");
    expect(buildSearchPostCard({ title: "T", body: null, city: null }, "").meta).toBe("");
  });
});
