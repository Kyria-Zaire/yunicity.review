import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import QRCode from "qrcode";
import { describe, expect, it } from "vitest";

import { passportQrSvgDataUrl } from "@/lib/passport/passport-qr-image";

/**
 * PASSPORT-QR-THIRD-PARTY-01 — le QR Passport est généré sur l'appareil ; son
 * contenu (jeton porteur) n'est plus envoyé à `api.qrserver.com`.
 * Jetons FICTIFS uniquement.
 */
const JETON_FICTIF = "YNCP1:fictif-0123456789abcdefABCDEF-_xyz";
const URL_RECLAMATION_FICTIVE = "https://preview.example.test/passport/stamp/claim?token=eyJhbGciOiJIUzI1NiJ9.fictif.signature";

describe("QR Passport généré localement (PASSPORT-QR-THIRD-PARTY-01)", () => {
  it.each([JETON_FICTIF, URL_RECLAMATION_FICTIVE])("rend un SVG en data: sans aucune adresse tierce — %s", async (valeur) => {
    const src = await passportQrSvgDataUrl(valeur);
    expect(src.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    const svg = decodeURIComponent(src.slice(src.indexOf(",") + 1));
    expect(svg).toMatch(/^<svg[\s\S]*<\/svg>\s*$/);
    expect(svg).not.toContain("qrserver");
    // Le jeton n'apparaît pas en clair dans l'image : il n'est porté que par les modules.
    expect(svg).not.toContain(valeur);
  });

  it.each([JETON_FICTIF, URL_RECLAMATION_FICTIVE])("encode la valeur EXACTE, sans transformation — %s", (valeur) => {
    const code = QRCode.create(valeur, { errorCorrectionLevel: "M" });
    // Mode octet : données UTF-8 en `Uint8Array` ; modes alphanumérique / numérique : chaîne.
    const contenu = code.segments
      .map((segment) => (typeof segment.data === "string" ? segment.data : new TextDecoder().decode(segment.data)))
      .join("");
    expect(contenu).toBe(valeur);
  });

  it("dessine dans le SVG exactement la matrice du QR de la valeur", async () => {
    const code = QRCode.create(JETON_FICTIF, { errorCorrectionLevel: "M" });
    const taille = code.modules.size;
    const src = await passportQrSvgDataUrl(JETON_FICTIF);
    const svg = decodeURIComponent(src.slice(src.indexOf(",") + 1));
    const trace = /<path[^>]*stroke="#000000"[^>]*d="([^"]+)"/.exec(svg)?.[1] ?? "";
    expect(trace, "tracé des modules introuvable").not.toBe("");

    // Reconstitue la matrice depuis les segments horizontaux du tracé (marge = 1).
    const matrice = Array.from({ length: taille }, () => Array<boolean>(taille).fill(false));
    let x = 0;
    let y = 0;
    for (const [, commande, a, b] of trace.matchAll(/([MmhvH])\s*(-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?))?/g)) {
      const n = Number(a);
      if (commande === "M") { x = n; y = Number(b); }
      else if (commande === "m") { x += n; y += Number(b ?? 0); }
      else if (commande === "h") { for (let i = 0; i < n; i++) matrice[Math.floor(y) - 1]![x - 1 + i] = true; x += n; }
    }
    const attendu = Array.from({ length: taille }, (_, ligne) =>
      Array.from({ length: taille }, (_, colonne) => code.modules.get(ligne, colonne) === 1),
    );
    expect(matrice).toEqual(attendu);
  });
});

describe("garde-fou — aucun service tiers de QR dans l'application", () => {
  it("aucune adresse https://api.qrserver.com dans components, hooks, lib, app", () => {
    const racine = fileURLToPath(new URL("../..", import.meta.url));
    const fautifs: string[] = [];
    const parcourir = (dossier: string) => {
      for (const nom of readdirSync(dossier)) {
        const chemin = path.join(dossier, nom);
        if (statSync(chemin).isDirectory()) { parcourir(chemin); continue; }
        if (!/\.(ts|tsx)$/.test(nom) || /\.test\.tsx?$/.test(nom)) continue;
        if (/https?:\/\/api\.qrserver\.com/.test(readFileSync(chemin, "utf8"))) fautifs.push(path.relative(racine, chemin));
      }
    };
    for (const dossier of ["components", "hooks", "lib", "app"]) parcourir(path.join(racine, dossier));
    expect(fautifs).toEqual([]);
  }, 60_000);
});
