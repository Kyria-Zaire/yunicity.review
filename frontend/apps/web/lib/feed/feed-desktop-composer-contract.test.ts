import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const desktopSource = readFileSync(
  fileURLToPath(new URL("../../components/feed/desktop/feed-desktop-composer.tsx", import.meta.url)),
  "utf-8",
);
const feedSource = readFileSync(
  fileURLToPath(new URL("../../components/feed/feed-composer.tsx", import.meta.url)),
  "utf-8",
);
const mobileSource = readFileSync(
  fileURLToPath(new URL("../../components/feed/mobile/feed-mobile-composer.tsx", import.meta.url)),
  "utf-8",
);
const territoryMobileSource = readFileSync(
  fileURLToPath(
    new URL(
      "../../components/shared/mobile/territory-mobile-post-composer.tsx",
      import.meta.url,
    ),
  ),
  "utf-8",
);

describe("Feed composers MEDIA-01 contract", () => {
  it("exposes a 4000-character cap on the desktop editable body field", () => {
    expect(desktopSource).toContain('id="feed-desktop-composer-body"');
    expect(desktopSource).toMatch(/maxLength=\{4000\}/);
  });

  it("restreint l'accept desktop au contrat JPEG/PNG/WebP", () => {
    expect(desktopSource).toContain("COMPOSER_MEDIA_ACCEPT_ATTR");
    expect(desktopSource).not.toMatch(/accept=["']image\/\*["']/);
  });

  it("annonce les erreurs avec role=alert et la progression avec aria-live=polite", () => {
    for (const source of [feedSource, mobileSource, desktopSource, territoryMobileSource]) {
      expect(source).toMatch(/role=["']alert["']/);
      expect(source).toMatch(/aria-live=["']polite["']/);
    }
  });

  it("prévisualise sans débordement (overflow + object-contain)", () => {
    for (const source of [feedSource, mobileSource, desktopSource, territoryMobileSource]) {
      expect(source).toMatch(/overflow-hidden/);
      expect(source).toMatch(/object-contain/);
    }
  });

  it("respecte motion-reduce sur le spinner desktop", () => {
    expect(desktopSource).toMatch(/motion-reduce:animate-none/);
  });

  it("verrouille la publication via mediaReadyForPublish", () => {
    for (const source of [feedSource, mobileSource, desktopSource, territoryMobileSource]) {
      expect(source).toContain("mediaReadyForPublish");
      expect(source).toContain("beginPublishing");
      expect(source).toContain("finishPublishing");
    }
  });
});
