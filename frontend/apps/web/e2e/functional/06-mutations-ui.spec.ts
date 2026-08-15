import { API_URL, bearer, expect, test } from "../fixtures";
import type { Locator, Response } from "@playwright/test";

/**
 * Browser-driven mutations (C3-F0-T3), mapped from the real mobile flows and corrected
 * in R5-DIAG after instrumented classification. Loginnable seeded actors (citizen_a/
 * citizen_b) carry the required data, so no registration is consumed here. Each mutation
 * is a real UI click; API is setup/proof only.
 *
 * Hydration-safe interaction: Next.js App Router renders client components server-side, so
 * a button can be visible/enabled a beat before its React handler is attached. `clickUntil`
 * re-issues the click ONLY while the expected resulting state is absent — a state-based
 * wait, never an arbitrary sleep — and never re-clicks once the result is present (so a
 * toggle is not flipped twice).
 */
async function clickUntil(trigger: Locator, result: Locator, timeout = 15_000): Promise<void> {
  await expect(async () => {
    if (!(await result.first().isVisible().catch(() => false))) {
      await trigger.first().click();
    }
    await expect(result.first()).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout });
}

test.describe("Publication UI (Create Hub)", () => {
  test("FAB Créer → Publier sur le fil → POST /posts → affiché", async ({ citizenAPage }) => {
    const marker = `E2E UI ${Date.now()}`;
    await citizenAPage.goto("/feed");
    // Mobile composer trigger is a button carrying the placeholder text; tap it, then the
    // visible textarea appears (a hidden desktop twin shares the id, so scope to :visible).
    await citizenAPage.locator('button:has-text("Quoi de neuf")').first().click();
    const box = citizenAPage.locator('textarea[placeholder*="Quoi de neuf"]:visible').first();
    await expect(box).toBeVisible({ timeout: 15_000 });
    await box.fill(marker);
    const [resp] = await Promise.all([
      citizenAPage.waitForResponse(
        (r) => /\/api\/v1\/posts(\?|$)/.test(r.url()) && r.request().method() === "POST",
      ),
      citizenAPage.getByRole("button", { name: "Publier", exact: true }).first().click(),
    ]);
    expect(resp.status(), await resp.text()).toBe(201);
    await expect(citizenAPage.getByText(marker).first()).toBeVisible({ timeout: 15_000 });
    await citizenAPage.reload();
    await expect(citizenAPage.getByText(marker).first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Tribu publique UI", () => {
  test("rejoindre (charte) puis quitter via l'UI", async ({ citizenBPage }) => {
    await citizenBPage.goto("/tribes/qa-tribu-publique?city=Reims");
    await citizenBPage.waitForLoadState("networkidle").catch(() => {});
    // The mobile hero "Rejoindre" opens the charter form (checkbox + confirm). Re-issue the
    // open-click only while the charter checkbox is absent (hydration-safe, no sleep).
    const charter = citizenBPage.locator('input[type="checkbox"]:visible').first();
    await clickUntil(citizenBPage.getByRole("button", { name: "Rejoindre", exact: true }), charter);
    await charter.check({ force: true });
    const confirmJoin = citizenBPage.getByRole("button", { name: "Rejoindre", exact: true }).last();
    await expect(confirmJoin).toBeEnabled({ timeout: 10_000 });
    const [joinResp] = await Promise.all([
      citizenBPage.waitForResponse(
        (r) => /\/tribes\/qa-tribu-publique\/join\?/.test(r.url()) && r.request().method() === "POST",
      ),
      confirmJoin.click(),
    ]);
    expect([200, 201]).toContain(joinResp.status());
    // Membership flips to the "Membre" action (exact name — the "Membres" tab also contains
    // the substring "Membre", so a loose has-text match would wrongly grab the tab).
    const membre = citizenBPage.getByRole("button", { name: "Membre", exact: true });
    await expect(membre.first()).toBeVisible({ timeout: 15_000 });
    // Leave via the "Membre" dropdown → "Quitter"; re-issue the menu-open only while "Quitter"
    // is absent (the menu is a client toggle → same hydration guard).
    const quitter = citizenBPage.locator('button:has-text("Quitter"):visible');
    await clickUntil(membre, quitter);
    const [leaveResp] = await Promise.all([
      citizenBPage.waitForResponse((r) => r.url().includes("/tribes/qa-tribu-publique/leave")),
      quitter.first().click(),
    ]);
    expect([200, 204]).toContain(leaveResp.status());
    await expect(
      citizenBPage.getByRole("button", { name: "Rejoindre", exact: true }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Tribu privée UI", () => {
  test("demande d'adhésion via l'UI → état en attente + persiste", async ({ citizenAPage, citizenA }) => {
    await citizenAPage.goto("/tribes/qa-tribu-privee?city=Reims");
    await citizenAPage.waitForLoadState("networkidle").catch(() => {});
    // The private gate renders "Demander à rejoindre"; the join-request POST has no optimistic
    // UI, so gate the retry on the network: once a terminal POST response is observed we NEVER
    // click again (no double mutation), and a missed pre-hydration click simply retries.
    const reqBtn = citizenAPage.getByRole("button", { name: "Demander à rejoindre", exact: true });
    let jrResp: Response | null = null;
    await expect(async () => {
      if (jrResp) return; // terminal response already seen → do not click again
      const respP = citizenAPage
        .waitForResponse(
          (r) =>
            /\/tribes\/qa-tribu-privee\/join-requests(\?|$)/.test(r.url()) &&
            r.request().method() === "POST",
          { timeout: 2_500 },
        )
        .catch(() => null);
      await reqBtn.first().click();
      jrResp = await respP;
      expect(jrResp, "join-request POST must fire").not.toBeNull();
    }).toPass({ timeout: 15_000 });
    // 201 created, or 409 if a prior attempt already registered the (unique-indexed) request.
    expect([201, 409]).toContain((jrResp as unknown as Response).status());
    const pending = citizenAPage.getByText(/en attente de validation/i);
    await expect(pending.first()).toBeVisible({ timeout: 15_000 });
    // Persistence proven server-side (the viewer field the UI reads on next load). API is proof
    // here, not a replacement — the state was produced by the real UI click above.
    const tribe = await citizenAPage.request.get(`${API_URL}/api/v1/tribes/qa-tribu-privee?city=Reims`, {
      headers: bearer(citizenA),
    });
    expect(((await tribe.json()) as { viewer_has_pending_join_request?: boolean }).viewer_has_pending_join_request).toBe(true);
  });
});

test.describe("Vidéo UI", () => {
  test("like via l'UI (écran détail) + persistance", async ({ citizenAPage, citizenA }) => {
    // The player opens via ?video={id} (query-param). The detail screen's like control lives
    // in VideosMobileDetailMeta with aria-label "J'aime" + aria-pressed (NOT the TikTok feed
    // rail's "Aimer la vidéo" — that label only exists in the fullscreen feed viewport).
    const feed = await citizenAPage.request.get(`${API_URL}/api/v1/local-videos/feed?city=Reims`, {
      headers: bearer(citizenA),
    });
    const vid = ((await feed.json()) as { items: Array<{ id: string }> }).items[0];
    if (!vid) throw new Error("seeded local video must exist");
    await citizenAPage.goto("/videos");
    await citizenAPage.waitForLoadState("networkidle").catch(() => {});
    await citizenAPage.locator(`a[href*="video=${vid.id}"]`).first().click();
    await citizenAPage.waitForURL(/video=/);
    await citizenAPage.waitForLoadState("networkidle").catch(() => {});
    const like = citizenAPage.locator("button[aria-label^=\"J'aime\"]:visible").first();
    await expect(like).toBeVisible({ timeout: 20_000 });
    await expect(like).toHaveAttribute("aria-pressed", "false");
    const likeResp = citizenAPage.waitForResponse(
      (r) => /\/local-videos\/[^/]+\/like/.test(r.url()) && r.request().method() === "POST",
    );
    const pressed = citizenAPage.locator(
      "button[aria-label^=\"J'aime\"][aria-pressed=\"true\"]:visible",
    );
    await clickUntil(like, pressed);
    expect([200, 201, 204]).toContain((await likeResp).status());
    // Persistence: reload and confirm the like held server-side.
    await citizenAPage.reload();
    await citizenAPage.waitForLoadState("networkidle").catch(() => {});
    await expect(
      citizenAPage.locator("button[aria-label^=\"J'aime\"][aria-pressed=\"true\"]:visible").first(),
    ).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("Notifications UI", () => {
  test("read-all via l'UI → non-lu = 0 + persiste", async ({ citizenAPage, citizenA }) => {
    await citizenAPage.goto("/notifications");
    await citizenAPage.waitForLoadState("networkidle").catch(() => {});
    // Mobile: read-all lives behind the "Actions notifications" menu — a client toggle, so
    // re-issue the open-click only while "Tout marquer comme lu" is absent (hydration-safe).
    const actionsMenu = citizenAPage.locator('button[aria-label="Actions notifications"]:visible');
    const markAll = citizenAPage.locator('button:has-text("Tout marquer comme lu"):visible');
    await clickUntil(actionsMenu, markAll);
    await expect(markAll.first()).toBeVisible({ timeout: 15_000 });
    const [resp] = await Promise.all([
      citizenAPage.waitForResponse((r) => r.url().includes("/notifications/read-all")),
      markAll.first().click(),
    ]);
    expect([200, 204]).toContain(resp.status());
    await citizenAPage.reload();
    // Persistence: unread is 0 after the real read-all + reload.
    const summary = await citizenAPage.request.get(`${API_URL}/api/v1/notifications/summary`, {
      headers: bearer(citizenA),
    });
    expect(((await summary.json()) as { unread_count?: number }).unread_count ?? -1).toBe(0);
  });
});

test.describe("Profil intérêts UI", () => {
  test("modifier les intérêts via l'UI → PATCH + persistance", async ({ citizenAPage, citizenA }) => {
    await citizenAPage.goto("/profile/me/edit");
    const sport = citizenAPage.getByRole("button", { name: "Sport", exact: true }).first();
    await expect(sport).toBeVisible({ timeout: 15_000 });
    await sport.click();
    const [resp] = await Promise.all([
      citizenAPage.waitForResponse(
        (r) => r.url().includes("/api/v1/profile/me") && ["PATCH", "PUT"].includes(r.request().method()),
      ),
      citizenAPage.locator('button:has-text("Enregistrer"):visible').first().click(),
    ]);
    expect(resp.status(), await resp.text()).toBe(200);
    const me = await citizenAPage.request.get(`${API_URL}/api/v1/profile/me`, {
      headers: bearer(citizenA),
    });
    expect(((await me.json()) as { interests?: string[] }).interests ?? []).toContain("sports");
  });
});

test.describe("Onboarding UI", () => {
  test("wizard complet (type → info → verify → finish) → compte créé", async ({ page }) => {
    // The register wizard has 4 steps and no OTP gate: POST /auth/register fires only at the
    // FINISH step and returns a session directly (verified in R5-DIAG). No external dependency.
    await page.goto("/register");
    await page.waitForLoadState("networkidle").catch(() => {});

    // Step type (select "Habitant") → info: retry the pair until the email field appears.
    const emailInput = page.locator('input[type="email"]:visible').first();
    await expect(async () => {
      if (!(await emailInput.isVisible().catch(() => false))) {
        await page.getByRole("button", { name: /Habitant/ }).first().click().catch(() => {});
        await page.getByRole("button", { name: /Continuer/ }).first().click().catch(() => {});
      }
      await expect(emailInput).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });

    // Negative validation: an invalid email must NOT advance to the verify step.
    await emailInput.fill("not-an-email");
    const pwdsNeg = page.locator('input[type="password"]:visible');
    for (let i = 0; i < (await pwdsNeg.count()); i++) await pwdsNeg.nth(i).fill("StrongPassword1!");
    await page.getByRole("button", { name: /Continuer/ }).first().click();
    await expect(emailInput).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('input[type="checkbox"]:visible')).toHaveCount(0);

    // Valid path: name, email, both passwords.
    const email = `e2e.onb.${Date.now()}@example.com`;
    const nameField = page
      .locator('input:not([type="email"]):not([type="password"]):not([type="checkbox"]):visible')
      .first();
    if (await nameField.isVisible().catch(() => false)) await nameField.fill("E2E Onb");
    await emailInput.fill(email);
    const pwds = page.locator('input[type="password"]:visible');
    for (let i = 0; i < (await pwds.count()); i++) await pwds.nth(i).fill("StrongPassword1!");

    // info → verify: the terms checkbox marks the verify step.
    const terms = page.locator('input[type="checkbox"]:visible').first();
    await clickUntil(page.getByRole("button", { name: /Continuer/ }), terms);
    await terms.check({ force: true });

    // verify → finish: the submit button marks the finish step.
    const submit = page.getByRole("button", { name: /Créer mon compte|S'inscrire|Terminer/ });
    await clickUntil(page.getByRole("button", { name: /Continuer/ }), submit);

    // finish: submit → POST /auth/register (201). On success the app logs the user in and
    // redirects to the post-auth path (/feed) — there is no OTP gate. Assert the authenticated
    // landing, which proves the account was created and the session established.
    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/v1/auth/register")),
      submit.first().click(),
    ]);
    expect(resp.status(), await resp.text()).toBe(201);
    await page.waitForURL(/\/feed/, { timeout: 15_000 });
    await expect(page.getByRole("button", { name: /Menu compte/ }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
