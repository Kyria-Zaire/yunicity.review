import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = fileURLToPath(new URL(".", import.meta.url));
const portalScreen = existsSync(`${here}../../components/feed/portal/feed-portal-screen.tsx`)
  ? readFileSync(`${here}../../components/feed/portal/feed-portal-screen.tsx`, "utf-8")
  : "";
const citizenShell = readFileSync(`${here}../../components/shell/citizen-authenticated-shell.tsx`, "utf-8");
const feedAppShell = `${here}../../components/feed/portal/feed-app-shell.tsx`;

describe("D0.1 — CitizenAuthenticatedShell migration", () => {
  it("migrates Feed portal from FeedAppShell to CitizenAuthenticatedShell", () => {
    expect(portalScreen).toContain("CitizenAuthenticatedShell");
    expect(portalScreen).not.toContain("FeedAppShell");
  });

  it("removes the legacy FeedAppShell after migration", () => {
    expect(existsSync(feedAppShell)).toBe(false);
  });

  it("preserves single <main> in CitizenAuthenticatedShell", () => {
    // Count <main> tags (should be exactly 1)
    const mainCount = (citizenShell.match(/<main/g) || []).length;
    expect(mainCount).toBe(1);
  });

  it("keeps CitizenTopNav, WebSidebar, and WebMobileStrategicBottomNav mounts", () => {
    expect(citizenShell).toContain("CitizenTopNav");
    expect(citizenShell).toContain("WebSidebar");
    expect(citizenShell).toContain("WebMobileStrategicBottomNav");
  });

  it("does not introduce breakpoint JavaScript", () => {
    expect(citizenShell).not.toMatch(/window\.innerWidth|matchMedia|useMediaQuery/);
  });

  it("preserves responsive class scoping (.citizen-medium-shell)", () => {
    expect(citizenShell).toContain("citizen-medium-shell");
  });
});
