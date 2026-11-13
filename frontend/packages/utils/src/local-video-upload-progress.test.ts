// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatUploadProgress,
  UploadCancelledError,
  uploadBinaryWithProgress,
  type UploadProgress,
} from "./local-video-upload-progress";

/**
 * Progression et annulation de l'envoi binaire — PR202-VIDEO-STREAMING.
 *
 * Deux propriétés comptent, et aucune n'est cosmétique.
 *
 * La progression doit venir des octets RÉELLEMENT transmis. Une barre animée
 * par un minuteur serait pire que pas de barre : elle affirmerait qu'il se
 * passe quelque chose alors que la connexion est peut-être morte.
 *
 * L'annulation doit interrompre la REQUÊTE, pas seulement l'interface. Une
 * annulation qui se contenterait de masquer un bouton laisserait 200 Mo
 * continuer de partir dans le vide, sur le forfait mobile de l'utilisateur.
 */

type FauxXhr = {
  status: number;
  responseText: string;
  timeout: number;
  upload: { onprogress: ((e: ProgressEvent) => void) | null };
  onload: (() => void) | null;
  onabort: (() => void) | null;
  onerror: (() => void) | null;
  ontimeout: (() => void) | null;
  open: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
  setRequestHeader: ReturnType<typeof vi.fn>;
};

let dernier: FauxXhr;
let envois: FauxXhr[] = [];

function installerXhr(): void {
  class Faux {
    status = 200;
    responseText = "";
    timeout = 0;
    upload: FauxXhr["upload"] = { onprogress: null };
    onload: (() => void) | null = null;
    onabort: (() => void) | null = null;
    onerror: (() => void) | null = null;
    ontimeout: (() => void) | null = null;
    open = vi.fn();
    send = vi.fn();
    setRequestHeader = vi.fn();
    abort = vi.fn(() => {
      // Un vrai XHR notifie `onabort` : sans cela le test prouverait seulement
      // que `abort()` a ete appele, pas que la promesse se resout.
      this.onabort?.();
    });

    constructor() {
      dernier = this as unknown as FauxXhr;
      envois.push(this as unknown as FauxXhr);
    }
  }
  vi.stubGlobal("XMLHttpRequest", Faux);
}

function progression(loaded: number, total: number | null): ProgressEvent {
  return {
    loaded,
    total: total ?? 0,
    lengthComputable: total !== null,
  } as ProgressEvent;
}

beforeEach(() => {
  envois = [];
  installerXhr();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function corps(): Blob {
  return new Blob([new Uint8Array(8)]);
}

describe("progression fondée sur les octets réellement transmis", () => {
  it("rapporte les octets confirmés et la fraction", async () => {
    const vues: UploadProgress[] = [];
    const promesse = uploadBinaryWithProgress({
      url: "https://exemple.test/binary",
      method: "PUT",
      body: corps(),
      onProgress: (p) => vues.push(p),
    });

    dernier.upload.onprogress?.(progression(50, 200));
    dernier.upload.onprogress?.(progression(200, 200));
    dernier.status = 204;
    dernier.onload?.();
    await promesse;

    expect(vues).toHaveLength(2);
    expect(vues[0]).toEqual({ loaded: 50, total: 200, ratio: 0.25 });
    expect(vues[1]).toEqual({ loaded: 200, total: 200, ratio: 1 });
  });

  it("n'invente aucun pourcentage quand le total est inconnu", async () => {
    // `lengthComputable: false` : le navigateur ne connaît pas la taille.
    // Afficher « 0 % » ou « 50 % » serait une affirmation fausse.
    const vues: UploadProgress[] = [];
    const promesse = uploadBinaryWithProgress({
      url: "https://exemple.test/binary",
      method: "PUT",
      body: corps(),
      onProgress: (p) => vues.push(p),
    });

    dernier.upload.onprogress?.(progression(1024, null));
    dernier.status = 204;
    dernier.onload?.();
    await promesse;

    expect(vues[0]?.total).toBeNull();
    expect(vues[0]?.ratio).toBeNull();
    expect(vues[0]?.loaded).toBe(1024);
  });

  it("la fraction ne dépasse jamais 1", async () => {
    const vues: UploadProgress[] = [];
    const promesse = uploadBinaryWithProgress({
      url: "https://exemple.test/binary",
      method: "PUT",
      body: corps(),
      onProgress: (p) => vues.push(p),
    });

    dernier.upload.onprogress?.(progression(300, 200));
    dernier.status = 204;
    dernier.onload?.();
    await promesse;

    expect(vues[0]?.ratio).toBe(1);
  });
});

describe("annulation", () => {
  it("interrompt réellement la requête, pas seulement l'affichage", async () => {
    const controleur = new AbortController();
    const promesse = uploadBinaryWithProgress({
      url: "https://exemple.test/binary",
      method: "PUT",
      body: corps(),
      signal: controleur.signal,
    });

    controleur.abort();

    await expect(promesse).rejects.toBeInstanceOf(UploadCancelledError);
    expect(dernier.abort).toHaveBeenCalledTimes(1);
  });

  it("un signal déjà annulé n'ouvre même pas de requête", async () => {
    const controleur = new AbortController();
    controleur.abort();

    await expect(
      uploadBinaryWithProgress({
        url: "https://exemple.test/binary",
        method: "PUT",
        body: corps(),
        signal: controleur.signal,
      }),
    ).rejects.toBeInstanceOf(UploadCancelledError);

    expect(envois).toHaveLength(0);
  });

  it("annuler après la fin ne rejette pas l'envoi réussi", async () => {
    const controleur = new AbortController();
    const promesse = uploadBinaryWithProgress({
      url: "https://exemple.test/binary",
      method: "PUT",
      body: corps(),
      signal: controleur.signal,
    });

    dernier.status = 204;
    dernier.onload?.();
    await expect(promesse).resolves.toMatchObject({ ok: true, status: 204 });

    // L'ecouteur doit avoir ete retire : sinon un abort tardif lèverait dans
    // le vide et masquerait une vraie erreur.
    controleur.abort();
    expect(dernier.abort).not.toHaveBeenCalled();
  });
});

describe("transport", () => {
  it("porte le jeton d'authentification quand il est fourni", async () => {
    const promesse = uploadBinaryWithProgress({
      url: "https://exemple.test/binary",
      method: "PUT",
      body: corps(),
      bearerToken: "jeton-de-test",
      headers: { "Content-Type": "video/mp4" },
    });
    dernier.status = 204;
    dernier.onload?.();
    await promesse;

    expect(dernier.setRequestHeader).toHaveBeenCalledWith("Content-Type", "video/mp4");
    expect(dernier.setRequestHeader).toHaveBeenCalledWith("Authorization", "Bearer jeton-de-test");
  });

  it("n'ajoute aucun en-tête d'authentification sur une URL présignée", async () => {
    const promesse = uploadBinaryWithProgress({
      url: "https://r2.exemple.test/objet",
      method: "PUT",
      body: corps(),
    });
    dernier.status = 200;
    dernier.onload?.();
    await promesse;

    const noms = dernier.setRequestHeader.mock.calls.map((c) => c[0]);
    expect(noms).not.toContain("Authorization");
  });

  it("rend le statut d'erreur au lieu de lever : l'appelant sait l'interpréter", async () => {
    const promesse = uploadBinaryWithProgress({
      url: "https://exemple.test/binary",
      method: "PUT",
      body: corps(),
    });
    dernier.status = 413;
    dernier.responseText = '{"code":"LOCAL_VIDEO_TOO_LARGE"}';
    dernier.onload?.();

    await expect(promesse).resolves.toMatchObject({
      ok: false,
      status: 413,
      body: '{"code":"LOCAL_VIDEO_TOO_LARGE"}',
    });
  });

  it("un échec réseau et un délai dépassé se distinguent", async () => {
    const reseau = uploadBinaryWithProgress({
      url: "https://exemple.test/binary",
      method: "PUT",
      body: corps(),
    });
    dernier.onerror?.();
    await expect(reseau).rejects.toThrow(/réseau/i);

    const delai = uploadBinaryWithProgress({
      url: "https://exemple.test/binary",
      method: "PUT",
      body: corps(),
      timeoutMs: 1234,
    });
    expect(dernier.timeout).toBe(1234);
    dernier.ontimeout?.();
    await expect(delai).rejects.toThrow(/délai/i);
  });
});

describe("affichage de la progression", () => {
  it("montre un pourcentage quand il est connu", () => {
    expect(formatUploadProgress({ loaded: 50, total: 200, ratio: 0.25 })).toBe("25 %");
  });

  it("montre les Mo envoyés quand le total est inconnu", () => {
    const message = formatUploadProgress({ loaded: 5 * 1024 * 1024, total: null, ratio: null });
    expect(message).toContain("5 Mo");
    expect(message).not.toContain("%");
  });

  it("ne montre rien sans progression", () => {
    expect(formatUploadProgress(null)).toBe("");
  });
});
