// @vitest-environment jsdom

/**
 * §3.4 bis du contrat — la clé d'une tentative dont l'issue est INDÉTERMINÉE
 * survit à la fermeture de l'écran, et elle seule.
 *
 * ⛔ Ni texte, ni médias, ni brouillon : la promesse « aucune récupération du
 * brouillon après rechargement » reste entière.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PENDING_REQUEST_STORAGE_KEY,
  clearPendingRequestId,
  readPendingRequestId,
  writePendingRequestId,
} from "@/lib/feed/pending-request-id";

const CLE = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

afterEach(() => {
  // Les espions d'abord : le stockage hostile d'un test n'expose pas `clear`.
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
});

describe("clé en attente — persistance", () => {
  it("relit la clé écrite pour le même compte", () => {
    writePendingRequestId("compte-a", CLE);
    expect(readPendingRequestId("compte-a")).toBe(CLE);
  });

  it("ne conserve QUE la clé — aucun contenu de brouillon", () => {
    writePendingRequestId("compte-a", CLE);
    const brut = window.sessionStorage.getItem(PENDING_REQUEST_STORAGE_KEY) ?? "";
    const stocke = JSON.parse(brut) as Record<string, unknown>;
    expect(Object.keys(stocke).sort()).toEqual(["accountId", "requestId"]);
  });

  it("efface la clé après un succès", () => {
    writePendingRequestId("compte-a", CLE);
    clearPendingRequestId();
    expect(readPendingRequestId("compte-a")).toBeNull();
    expect(window.sessionStorage.getItem(PENDING_REQUEST_STORAGE_KEY)).toBeNull();
  });
});

describe("clé en attente — isolation par compte", () => {
  it("ignore ET efface une clé qui appartient à un autre compte", () => {
    writePendingRequestId("compte-a", CLE);
    expect(readPendingRequestId("compte-b")).toBeNull();
    // Effacée, pas seulement ignorée : elle ne doit pas ressurgir au retour
    // du premier compte sur un appareil partagé.
    expect(window.sessionStorage.getItem(PENDING_REQUEST_STORAGE_KEY)).toBeNull();
  });

  it("n'écrit rien sans compte identifié", () => {
    writePendingRequestId(null, CLE);
    expect(window.sessionStorage.getItem(PENDING_REQUEST_STORAGE_KEY)).toBeNull();
  });

  it("ne rend rien sans compte identifié", () => {
    writePendingRequestId("compte-a", CLE);
    expect(readPendingRequestId(null)).toBeNull();
  });
});

describe("clé en attente — stockage hostile", () => {
  it("survit à un sessionStorage qui lève (navigation privée)", () => {
    const hostile = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("SecurityError");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
    };
    vi.spyOn(window, "sessionStorage", "get").mockReturnValue(
      hostile as unknown as Storage,
    );

    expect(() => writePendingRequestId("compte-a", CLE)).not.toThrow();
    expect(readPendingRequestId("compte-a")).toBeNull();
    expect(() => clearPendingRequestId()).not.toThrow();
  });

  it("ignore un contenu stocké illisible", () => {
    window.sessionStorage.setItem(PENDING_REQUEST_STORAGE_KEY, "{pas du json");
    expect(readPendingRequestId("compte-a")).toBeNull();
  });

  it("ignore une forme stockée inattendue", () => {
    window.sessionStorage.setItem(PENDING_REQUEST_STORAGE_KEY, JSON.stringify({ requestId: 42 }));
    expect(readPendingRequestId("compte-a")).toBeNull();
  });
});
