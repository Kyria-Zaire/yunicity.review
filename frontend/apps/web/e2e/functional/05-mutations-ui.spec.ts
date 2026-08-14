import { API_URL, bearer, expect, test } from "../fixtures";

/**
 * Browser-driven mutation (C3-F0-T3-R2). The mutation is performed by clicking a REAL UI
 * control (the mobile event-detail bookmark), not an API call. The API is used only to
 * resolve the event id (setup). The toggle response is authoritative on the new state,
 * so the test is independent of any prior interest state (order-independent).
 */
// Mobile event-detail interest control = fixed action-bar bookmark button (aria-label).
const CTA = 'button[aria-label="Enregistrer"]:visible';
const SAVED = 'button[aria-label="Enregistré"]:visible';

test("intérêt événement via l'UI → requête réelle + état visuel + persiste au reload", async ({
  authedPage,
  api,
  sharedUser,
}) => {
  const list = await api.get(`${API_URL}/api/v1/events?city=Reims`, { headers: bearer(sharedUser) });
  const items = ((await list.json()) as { items: Array<{ id: string; title: string }> }).items;
  const future = items.find((e) => /futur/i.test(e.title)) ?? items[0];
  if (!future) throw new Error("seeded future event must exist");

  await authedPage.goto(`/events/${future.id}`);
  const toggle = authedPage.locator(`${CTA}, ${SAVED}`).first();
  await expect(toggle).toBeVisible({ timeout: 15_000 });

  const [resp] = await Promise.all([
    authedPage.waitForResponse((r) => r.url().includes(`/events/${future.id}/interest`)),
    toggle.click(),
  ]);
  expect([200, 201]).toContain(resp.status());
  const nowInterested = Boolean((await resp.json()).interested);
  const expected = nowInterested ? SAVED : CTA;

  // Visual state matches the authoritative server state after the real click.
  await expect(authedPage.locator(expected).first()).toBeVisible({ timeout: 15_000 });

  // Reload → the visual state persists (real persistence, not optimistic UI).
  await authedPage.reload();
  await expect(authedPage.locator(expected).first()).toBeVisible({ timeout: 15_000 });
});
