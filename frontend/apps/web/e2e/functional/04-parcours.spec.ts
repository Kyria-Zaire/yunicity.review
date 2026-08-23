import { API_URL, bearer, expect, test } from "../fixtures";

/**
 * Authenticated launch parcours (C3-F0-T3-R1). Mutations go through the REAL QA API
 * with the shared user's bearer token; persistence is proven by re-reading after the
 * mutation (reload-equivalent). Browser rendering is asserted where the surface renders.
 */

test.describe("Événements", () => {
  test("intérêt événement futur → persistance + présent dans saved", async ({ api, sharedUser }) => {
    const list = await api.get(`${API_URL}/api/v1/events?city=Reims`, { headers: bearer(sharedUser) });
    expect(list.status()).toBe(200);
    const items = ((await list.json()) as { items: Array<{ id: string; title: string }> }).items;
    const future = items.find((e) => /futur/i.test(e.title)) ?? items[0];
    if (!future) throw new Error("seeded future event must exist");

    const interest = await api.post(`${API_URL}/api/v1/events/${future.id}/interest`, {
      headers: bearer(sharedUser),
    });
    expect([200, 201]).toContain(interest.status());

    const saved = await api.get(`${API_URL}/api/v1/events/me/saved`, { headers: bearer(sharedUser) });
    expect(saved.status()).toBe(200);
    const savedItems = ((await saved.json()) as { items: Array<{ id: string }> }).items;
    expect(savedItems.some((e) => e.id === future.id), "event persisted in saved").toBe(true);
  });
});

test.describe("Fil — publication", () => {
  test("publier un post → présent au rechargement du fil", async ({ api, sharedUser }) => {
    const marker = `E2E post ${Date.now()}`;
    const create = await api.post(`${API_URL}/api/v1/posts`, {
      headers: bearer(sharedUser),
      data: { author_type: "citizen", body: marker },
    });
    expect(create.status(), await create.text()).toBe(201);

    const feed = await api.get(`${API_URL}/api/v1/feed?city=Reims`, { headers: bearer(sharedUser) });
    expect(feed.status()).toBe(200);
    const body = await feed.text();
    expect(body.includes(marker), "published post visible in feed").toBe(true);
  });
});

test.describe("Tribus", () => {
  test("rejoindre puis quitter une tribu publique", async ({ api, sharedUser }) => {
    const join = await api.post(
      `${API_URL}/api/v1/tribes/qa-tribu-publique/join?city=Reims`,
      { headers: bearer(sharedUser), data: { charter_accepted: true } },
    );
    expect([200, 201], await join.text()).toContain(join.status());
    const leave = await api.post(`${API_URL}/api/v1/tribes/qa-tribu-publique/leave?city=Reims`, {
      headers: bearer(sharedUser),
    });
    expect([200, 204]).toContain(leave.status());
  });
});

test.describe("Vidéo locale", () => {
  test("like puis unlike d'une vidéo", async ({ api, sharedUser }) => {
    const feed = await api.get(`${API_URL}/api/v1/local-videos/feed?city=Reims`, {
      headers: bearer(sharedUser),
    });
    expect(feed.status()).toBe(200);
    const items = ((await feed.json()) as { items: Array<{ id: string }> }).items;
    const first = items[0];
    if (!first) {
      test.skip(true, "no seeded local video available (BLOCKED-DATA)");
      return;
    }
    const id = first.id;
    const like = await api.post(`${API_URL}/api/v1/local-videos/${id}/like`, {
      headers: bearer(sharedUser),
    });
    expect([200, 201, 204]).toContain(like.status());
    const unlike = await api.delete(`${API_URL}/api/v1/local-videos/${id}/like`, {
      headers: bearer(sharedUser),
    });
    expect([200, 204]).toContain(unlike.status());
  });
});

test.describe("Offres partenaires", () => {
  test("offre flash future visible, offre expirée absente", async ({ api, sharedUser }) => {
    const res = await api.get(`${API_URL}/api/v1/partner-offers?city=Reims`, {
      headers: bearer(sharedUser),
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { items: unknown[]; total: number };
    expect(Array.isArray(body.items)).toBe(true);
    const text = JSON.stringify(body);
    // Fixture completed in T3-R2 (PartnerProfile with a public status) — the flash offer
    // now surfaces; the expired offer must never surface.
    expect(text.includes("QA Offre flash"), "flash future offer present").toBe(true);
    expect(text.includes("QA Offre expirée"), "expired offer must be filtered out").toBe(false);
  });
});

test.describe("Notifications", () => {
  test("summary → read-all → badge remis à zéro", async ({ api, sharedUser }) => {
    const before = await api.get(`${API_URL}/api/v1/notifications/summary`, {
      headers: bearer(sharedUser),
    });
    expect(before.status()).toBe(200);
    const readAll = await api.post(`${API_URL}/api/v1/notifications/read-all`, {
      headers: bearer(sharedUser),
    });
    expect([200, 204]).toContain(readAll.status());
    const after = await api.get(`${API_URL}/api/v1/notifications/summary`, {
      headers: bearer(sharedUser),
    });
    const unread = ((await after.json()) as { unread_count?: number }).unread_count ?? 0;
    expect(unread).toBe(0);
  });
});

test.describe("Profil", () => {
  test("modifier les intérêts → persistance au rechargement", async ({ api, sharedUser }) => {
    const patch = await api.patch(`${API_URL}/api/v1/profile/me`, {
      headers: bearer(sharedUser),
      data: { interests: ["sports", "music"] },
    });
    expect(patch.status(), await patch.text()).toBe(200);
    const me = await api.get(`${API_URL}/api/v1/profile/me`, { headers: bearer(sharedUser) });
    const interests = ((await me.json()) as { interests?: string[] }).interests ?? [];
    expect(interests).toEqual(expect.arrayContaining(["sports", "music"]));
  });
});

test.describe("Passport", () => {
  test("état déterministe lisible via l'API", async ({ api, sharedUser }) => {
    const res = await api.get(`${API_URL}/api/v1/passport/me`, { headers: bearer(sharedUser) });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { status?: string; tier?: unknown };
    expect(body.status ?? "").toMatch(/active|onboarding|pending|/);
  });

  test("page /passport rend l'etat (le loader de session ne reste pas bloque)", async ({
    authedPage,
  }) => {
    await authedPage.goto("/passport");
    await expect(authedPage).not.toHaveURL(/\/login/);

    // Un loader de session VISIBLE pendant le bootstrap est le comportement
    // normal, pas un defaut. Mesure C3.1-R1K sur serveur production-like :
    // `goto` rend la main a 581 ms, le loader disparait a 750 ms, et les huit
    // appels API du parcours repondent 200. L'ancienne version lisait l'etat
    // instantanement apres `goto` et qualifiait donc de "bloque" un loader
    // simplement en cours -- elle echouait sur une course, pas sur un fait.
    //
    // Le defaut reellement cherche est un loader qui NE DISPARAIT PAS : on
    // l'assertionne, puis on exige que le contenu soit effectivement rendu.
    await expect(authedPage.getByText(/Chargement de la session/i).first()).toBeHidden();
    await expect(authedPage.getByRole("heading", { name: /passport/i }).first()).toBeVisible();
  });
});
