import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const composerSource = readFileSync(
  fileURLToPath(new URL("../../components/feed/desktop/feed-desktop-composer.tsx", import.meta.url)),
  "utf-8",
);

describe("FeedDesktopComposer functional contract", () => {
  it("exposes a 4000-character cap on the editable body field", () => {
    expect(composerSource).toContain('id="feed-desktop-composer-body"');
    expect(composerSource).toMatch(/maxLength=\{4000\}/);
  });
});
