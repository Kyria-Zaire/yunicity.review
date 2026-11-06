import { describe, expect, it, vi } from "vitest";

import { AuthClient } from "./auth/auth-client";
import { createFeedApi } from "./feed-api";
import type { TokenStorage } from "./storage/token-storage";

describe("FeedApi uploadPostMedia — MEDIA-01", () => {
  it("propage AbortSignal jusqu'à la requête multipart", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: "/media/photo.jpg", media_type: "image" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const api = createFeedApi({ fetch } as unknown as AuthClient, "https://api.test/api/v1");
    const controller = new AbortController();

    await api.uploadPostMedia(new File(["x"], "photo.jpg", { type: "image/jpeg" }), controller.signal);

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      signal: controller.signal,
    });
    expect(fetch.mock.calls[0]?.[1]?.body).toBeInstanceOf(FormData);
  });
});

/**
 * FEED-NEW-UX-01 — §4 du contrat backend ↔ frontend.
 *
 * `createPost` construit son corps CHAMP PAR CHAMP : un champ ajouté au payload
 * par l'appelant est silencieusement supprimé s'il n'est pas transmis ici. Un
 * test du hook d'envoi ne le verrait pas — il mocke `createFeedPost` et reçoit
 * donc l'objet AVANT ce filtrage. La preuve doit porter sur le corps réseau.
 */
describe("FeedApi createPost — clé d'idempotence atteint le corps réseau", () => {
  /** Vrai `AuthClient`, dont seul l'accès réseau est espionné : aucun cast. */
  function clientEspion() {
    const storage: TokenStorage = {
      getAccessToken: () => "jeton",
      setAccessToken: () => undefined,
    };
    const client = new AuthClient({
      apiBaseUrl: "https://api.test",
      platform: "web",
      storage,
    });
    const fetchSpy = vi.spyOn(client, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "post-1" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    return { client, fetchSpy };
  }

  function corpsEnvoye(init: RequestInit | undefined): Record<string, unknown> {
    return JSON.parse(String(init?.body)) as Record<string, unknown>;
  }

  it("transmet la clé fournie par l'appelant", async () => {
    const { client, fetchSpy } = clientEspion();
    const cle = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

    await createFeedApi(client, "https://api.test").createPost({
      body: "Bonjour Reims",
      client_request_id: cle,
    });

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("https://api.test/api/v1/posts");
    expect(corpsEnvoye(init)).toMatchObject({ client_request_id: cle });
  });

  /**
   * Le serveur rend **200** au rejeu d'une clé déjà vue, et **201** à la
   * création. Les deux sont des succès : le client ne doit pas prendre le rejeu
   * pour une erreur, sans quoi il annoncerait un échec sur une publication qui
   * existe (§3.2 et §3.4 bis du contrat).
   */
  it("traite 200 (rejeu) comme un succès, au même titre que 201", async () => {
    const storage: TokenStorage = {
      getAccessToken: () => "jeton",
      setAccessToken: () => undefined,
    };
    const client = new AuthClient({ apiBaseUrl: "https://api.test", platform: "web", storage });
    vi.spyOn(client, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "post-existant" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const rejeu = await createFeedApi(client, "https://api.test").createPost({
      body: "Bonjour Reims",
      client_request_id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    });

    expect(rejeu).toMatchObject({ id: "post-existant" });
  });

  it("sans clé, envoie null — comportement actuel strictement inchangé", async () => {
    const { client, fetchSpy } = clientEspion();

    await createFeedApi(client, "https://api.test").createPost({ body: "Bonjour Reims" });

    expect(corpsEnvoye(fetchSpy.mock.calls[0]?.[1])).toHaveProperty("client_request_id", null);
  });
});
