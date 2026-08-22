import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * C3-QA-SEC-01 — contrat de bind de la façade QA.
 *
 * Aucun socket n'est ouvert ici. Reproduire réellement un bind `0.0.0.0` pour
 * prouver le défaut exposerait QA sur toutes les interfaces le temps du test :
 * la preuve porte donc sur la résolution PURE et sur le TEXTE des sources qui
 * décident du bind.
 *
 * Contexte : le 22/08/2026, une relance de la façade sans `E2E_PROXY_HOST` a
 * publié le Feed QA authentifié sur `0.0.0.0:3002` depuis un Wi-Fi public. Le
 * défaut implicite était public ; il devient loopback, la surcharge explicite
 * restant possible pour une revue LAN dûment autorisée.
 */
const lire = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf-8");

describe("résolution de l'hôte de la façade QA", () => {
  it("variable absente → loopback", async () => {
    const { resolveProxyHost } = await import("./e2e-proxy-host.mjs");
    expect(resolveProxyHost({})).toBe("127.0.0.1");
  });

  it("variable non définie explicitement → loopback", async () => {
    const { resolveProxyHost } = await import("./e2e-proxy-host.mjs");
    expect(resolveProxyHost({ E2E_PROXY_HOST: undefined })).toBe("127.0.0.1");
  });

  it("chaîne vide ou blanche → loopback, jamais de repli public", async () => {
    const { resolveProxyHost } = await import("./e2e-proxy-host.mjs");
    expect(resolveProxyHost({ E2E_PROXY_HOST: "" })).toBe("127.0.0.1");
    expect(resolveProxyHost({ E2E_PROXY_HOST: "   " })).toBe("127.0.0.1");
    expect(resolveProxyHost({ E2E_PROXY_HOST: "\t\n" })).toBe("127.0.0.1");
  });

  it("surcharge loopback explicite → conservée", async () => {
    const { resolveProxyHost } = await import("./e2e-proxy-host.mjs");
    expect(resolveProxyHost({ E2E_PROXY_HOST: "127.0.0.1" })).toBe("127.0.0.1");
  });

  it("surcharge explicite non vide → conservée telle quelle", async () => {
    const { resolveProxyHost } = await import("./e2e-proxy-host.mjs");
    // Une revue LAN autorisée doit rester possible : la fonction ne censure pas
    // une valeur explicite, elle refuse seulement de la DEVINER.
    expect(resolveProxyHost({ E2E_PROXY_HOST: "0.0.0.0" })).toBe("0.0.0.0");
    expect(resolveProxyHost({ E2E_PROXY_HOST: "192.168.1.20" })).toBe("192.168.1.20");
    expect(resolveProxyHost({ E2E_PROXY_HOST: "  ::1  " })).toBe("::1");
  });

  it("lit `process.env` par défaut sans planter", async () => {
    const { resolveProxyHost } = await import("./e2e-proxy-host.mjs");
    expect(typeof resolveProxyHost()).toBe("string");
  });
});

describe("sources de bind de la façade — aucun défaut public", () => {
  it("le proxy ne retombe jamais sur 0.0.0.0 en l'absence de E2E_PROXY_HOST", () => {
    const source = lire("./e2e-reverse-proxy.mjs");
    const defaut = source.match(/E2E_PROXY_HOST\s*\?\?\s*"([^"]*)"/)?.[1] ?? null;
    expect(defaut, "défaut implicite littéral dans le proxy").not.toBe("0.0.0.0");
  });

  it("le script de démarrage canonique ne force pas un bind public", () => {
    const source = lire("../../../../scripts/qa-web-server.sh");
    const force = source.match(/E2E_PROXY_HOST\s*=\s*"([^"]*)"/)?.[1] ?? null;
    expect(force, "surcharge codée en dur dans qa-web-server.sh").not.toBe("0.0.0.0");
  });

  it("aucune source de bind de la façade ne mentionne 0.0.0.0", () => {
    const sources = {
      "e2e-reverse-proxy.mjs": lire("./e2e-reverse-proxy.mjs"),
      "qa-web-server.sh": lire("../../../../scripts/qa-web-server.sh"),
    };
    const fautives = Object.entries(sources)
      .filter(([, texte]) => texte.includes("0.0.0.0"))
      .map(([nom]) => nom);
    expect(fautives, `sources mentionnant encore 0.0.0.0 : ${fautives.join(", ") || "aucune"}`)
      .toEqual([]);
  });
});
