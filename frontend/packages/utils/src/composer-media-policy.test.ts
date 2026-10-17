import { describe, expect, it } from "vitest";

import {
  COMPOSER_MEDIA_HEIC_NOT_SUPPORTED,
  COMPOSER_MEDIA_INVALID_TYPE,
  COMPOSER_MEDIA_MAX_BYTES,
  COMPOSER_MEDIA_TOO_LARGE,
  COMPOSER_MEDIA_UPLOAD_TIMEOUT_BASE_MS,
  COMPOSER_MEDIA_UPLOAD_TIMEOUT_CAP_MS,
  COMPOSER_MEDIA_UPLOAD_MIN_THROUGHPUT_BPS,
  composerMediaUploadTimeoutMs,
  validateComposerMediaFile,
} from "./composer-media";

const MIB = 1024 * 1024;

/** Durée réelle d'un envoi, en ms, pour un débit nominal rendu à `rendement`. */
function dureeReelleMs(octets: number, debitMbps: number, rendement: number): number {
  return (octets * 8 * 1000) / (debitMbps * 1_000_000 * rendement);
}

describe("budget de temps d'envoi — GATE 1", () => {
  // Le correctif initial imposait 30 s fixes. Or la limite AUTORISÉE est de
  // 20 MiB : à 30 s, un fichier parfaitement conforme est condamné dès que le
  // débit utile descend sous ~5,6 Mbit/s, ce qui est le cas courant en mobile.
  it("ne condamne aucun fichier conforme sur un lien mobile à 1 Mbit/s rendu à 60 %", () => {
    for (const mib of [1, 5, 10, 20]) {
      const octets = mib * MIB;
      const budget = composerMediaUploadTimeoutMs(octets);
      const besoin = dureeReelleMs(octets, 1, 0.6);
      expect(budget, `${mib} MiB condamné à 1 Mbit/s réaliste`).toBeGreaterThan(besoin);
    }
  });

  it("laisse une marge fixe au-delà du temps de transfert pur", () => {
    // La marge couvre poignée de main, TLS, authentification et traitement
    // serveur : elle ne doit pas dépendre de la taille.
    const marges = [1, 5, 10, 20].map((mib) => {
      const octets = mib * MIB;
      return composerMediaUploadTimeoutMs(octets) - dureeReelleMs(octets, 1, 0.6);
    });
    for (const marge of marges) {
      expect(marge).toBeCloseTo(COMPOSER_MEDIA_UPLOAD_TIMEOUT_BASE_MS, -2);
    }
  });

  it("croît avec la taille", () => {
    expect(composerMediaUploadTimeoutMs(10 * MIB)).toBeGreaterThan(
      composerMediaUploadTimeoutMs(1 * MIB),
    );
  });

  it("reste sous le plafond, et le plafond couvre la taille maximale autorisée", () => {
    expect(composerMediaUploadTimeoutMs(COMPOSER_MEDIA_MAX_BYTES)).toBeLessThanOrEqual(
      COMPOSER_MEDIA_UPLOAD_TIMEOUT_CAP_MS,
    );
    // Un plafond qui tronquerait le pire cas conforme reviendrait à réintroduire
    // le défaut corrigé.
    expect(composerMediaUploadTimeoutMs(COMPOSER_MEDIA_MAX_BYTES)).toBeGreaterThan(
      dureeReelleMs(COMPOSER_MEDIA_MAX_BYTES, 1, 0.6),
    );
  });

  it("borne une taille aberrante au plafond", () => {
    expect(composerMediaUploadTimeoutMs(10_000 * MIB)).toBe(COMPOSER_MEDIA_UPLOAD_TIMEOUT_CAP_MS);
  });

  it("reste défini pour une taille nulle ou absurde", () => {
    expect(composerMediaUploadTimeoutMs(0)).toBe(COMPOSER_MEDIA_UPLOAD_TIMEOUT_BASE_MS);
    expect(composerMediaUploadTimeoutMs(-1)).toBe(COMPOSER_MEDIA_UPLOAD_TIMEOUT_BASE_MS);
    expect(composerMediaUploadTimeoutMs(Number.NaN)).toBe(COMPOSER_MEDIA_UPLOAD_TIMEOUT_BASE_MS);
  });

  it("le plancher de débit toléré est explicite et non optimiste", () => {
    // 600 kbit/s utiles = 1 Mbit/s annoncé rendu à 60 %.
    expect(COMPOSER_MEDIA_UPLOAD_MIN_THROUGHPUT_BPS).toBeLessThanOrEqual(600_000);
  });
});

describe("contrat de métadonnées navigateur — GATE 5", () => {
  const petit = 1024;

  it("accepte les trois types déclarés explicitement", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validateComposerMediaFile({ type, size: petit, name: `photo.${type.slice(6)}` })).toEqual({
        ok: true,
      });
    }
  });

  it("normalise casse et paramètre du MIME", () => {
    expect(
      validateComposerMediaFile({ type: "IMAGE/JPEG; charset=binary", size: petit, name: "a.jpg" }),
    ).toEqual({ ok: true });
  });

  it("refuse HEIC/HEIF déclarés, avec le message explicite", () => {
    for (const type of ["image/heic", "image/heif"]) {
      expect(validateComposerMediaFile({ type, size: petit, name: "IMG_0001.HEIC" })).toEqual({
        ok: false,
        error: COMPOSER_MEDIA_HEIC_NOT_SUPPORTED,
      });
    }
  });

  it("refuse .HEIC/.HEIF à MIME vide avec le MÊME message explicite", () => {
    // iOS partage régulièrement un fichier sans type MIME. Sans l'extension,
    // l'utilisateur recevait le message générique et ne savait pas qu'il devait
    // convertir son image.
    for (const name of ["IMG_0001.HEIC", "img.heif", "photo.Heic"]) {
      expect(validateComposerMediaFile({ type: "", size: petit, name })).toEqual({
        ok: false,
        error: COMPOSER_MEDIA_HEIC_NOT_SUPPORTED,
      });
    }
  });

  it("refuse .HEIC déguisé en JPEG par son MIME déclaré", () => {
    // Le MIME est déclaratif : on ne l'accepte jamais contre une extension HEIC.
    expect(validateComposerMediaFile({ type: "image/jpeg", size: petit, name: "IMG.HEIC" })).toEqual(
      { ok: false, error: COMPOSER_MEDIA_HEIC_NOT_SUPPORTED },
    );
  });

  it("laisse passer un JPEG à MIME vide, le backend restant l'autorité", () => {
    // Décision mobile explicite : refuser localement une image que l'utilisateur
    // vient de choisir, au seul motif que le navigateur n'a pas renseigné le
    // type, produit exactement l'erreur signalée sur téléphone. Le backend
    // valide les magic bytes et refusera un contenu non conforme.
    for (const name of ["photo.jpg", "photo.JPEG", "image.png", "image.webp"]) {
      expect(validateComposerMediaFile({ type: "", size: petit, name })).toEqual({ ok: true });
    }
  });

  it("laisse passer un MIME générique octet-stream avec extension supportée", () => {
    expect(
      validateComposerMediaFile({ type: "application/octet-stream", size: petit, name: "p.jpg" }),
    ).toEqual({ ok: true });
  });

  it("refuse un MIME vide sans extension exploitable", () => {
    for (const name of ["", "sans-extension", "archive.zip"]) {
      expect(validateComposerMediaFile({ type: "", size: petit, name })).toEqual({
        ok: false,
        error: COMPOSER_MEDIA_INVALID_TYPE,
      });
    }
  });

  it("refuse un type non image explicitement déclaré", () => {
    expect(validateComposerMediaFile({ type: "application/pdf", size: petit, name: "a.pdf" })).toEqual(
      { ok: false, error: COMPOSER_MEDIA_INVALID_TYPE },
    );
  });

  it("reste compatible avec un appel sans nom de fichier", () => {
    expect(validateComposerMediaFile({ type: "image/jpeg", size: petit })).toEqual({ ok: true });
    expect(validateComposerMediaFile({ type: "", size: petit })).toEqual({
      ok: false,
      error: COMPOSER_MEDIA_INVALID_TYPE,
    });
  });

  it("applique la taille maximale quel que soit le chemin d'acceptation", () => {
    const trop = COMPOSER_MEDIA_MAX_BYTES + 1;
    expect(validateComposerMediaFile({ type: "image/jpeg", size: trop, name: "a.jpg" })).toEqual({
      ok: false,
      error: COMPOSER_MEDIA_TOO_LARGE,
    });
    // Le chemin « MIME vide + extension » ne doit pas contourner la taille.
    expect(validateComposerMediaFile({ type: "", size: trop, name: "a.jpg" })).toEqual({
      ok: false,
      error: COMPOSER_MEDIA_TOO_LARGE,
    });
  });

  it("n'affirme jamais que le contenu est valide", () => {
    // Le frontend ne lit pas les magic bytes : aucun message ne doit le laisser
    // croire. Capture non vide garantie par la liste ci-dessous.
    const messages = [COMPOSER_MEDIA_INVALID_TYPE, COMPOSER_MEDIA_HEIC_NOT_SUPPORTED];
    expect(messages.length).toBeGreaterThan(0);
    for (const message of messages) {
      expect(message).not.toMatch(/valide|vérifié|authentifi/i);
    }
  });
});

describe("audit de l'implémentation du budget — CORRECTION 4", () => {
  it("applique exactement la formule annoncée : base + taille × 8 / plancher", () => {
    for (const octets of [1, 1024, 1 * MIB, 3 * MIB, 7 * MIB, COMPOSER_MEDIA_MAX_BYTES]) {
      const attendu = Math.min(
        COMPOSER_MEDIA_UPLOAD_TIMEOUT_CAP_MS,
        COMPOSER_MEDIA_UPLOAD_TIMEOUT_BASE_MS +
          Math.round((octets * 8 * 1000) / COMPOSER_MEDIA_UPLOAD_MIN_THROUGHPUT_BPS),
      );
      expect(composerMediaUploadTimeoutMs(octets)).toBe(attendu);
    }
  });

  it("compte des BITS, pas des octets", () => {
    // Confondre les deux diviserait le budget par huit — soit le défaut corrigé.
    const octets = 1 * MIB;
    const transfert =
      composerMediaUploadTimeoutMs(octets) - COMPOSER_MEDIA_UPLOAD_TIMEOUT_BASE_MS;
    expect(transfert).toBeCloseTo((octets * 8 * 1000) / COMPOSER_MEDIA_UPLOAD_MIN_THROUGHPUT_BPS, 0);
    expect(transfert).not.toBeCloseTo((octets * 1000) / COMPOSER_MEDIA_UPLOAD_MIN_THROUGHPUT_BPS, 0);
  });

  it("les constantes valent bien 15 s, 600 kbit/s et 300 s", () => {
    expect(COMPOSER_MEDIA_UPLOAD_TIMEOUT_BASE_MS).toBe(15_000);
    expect(COMPOSER_MEDIA_UPLOAD_MIN_THROUGHPUT_BPS).toBe(600_000);
    expect(COMPOSER_MEDIA_UPLOAD_TIMEOUT_CAP_MS).toBe(300_000);
  });

  it("ne déborde pas et reste un entier fini sur des valeurs extrêmes", () => {
    for (const octets of [
      Number.MAX_SAFE_INTEGER,
      1e15,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]) {
      const budget = composerMediaUploadTimeoutMs(octets);
      expect(Number.isFinite(budget)).toBe(true);
      expect(Number.isInteger(budget)).toBe(true);
      expect(budget).toBeGreaterThanOrEqual(COMPOSER_MEDIA_UPLOAD_TIMEOUT_BASE_MS);
      expect(budget).toBeLessThanOrEqual(COMPOSER_MEDIA_UPLOAD_TIMEOUT_CAP_MS);
    }
  });

  it("une taille au-dessus de la limite autorisée est bornée, pas rejetée ici", () => {
    // La taille est refusée par le validateur ; le budget, lui, reste défini.
    expect(composerMediaUploadTimeoutMs(COMPOSER_MEDIA_MAX_BYTES + 1)).toBeLessThanOrEqual(
      COMPOSER_MEDIA_UPLOAD_TIMEOUT_CAP_MS,
    );
  });

  it("ne dépend d'aucune variable d'environnement", () => {
    const source = composerMediaUploadTimeoutMs.toString();
    expect(source).not.toMatch(/process\.env|import\.meta\.env|NEXT_PUBLIC_/);
  });

  it("le plancher est opérationnel, pas universel : un lien plus lent dépasse le plafond", () => {
    // Honnêteté de la politique : à 300 kbit/s utiles, 20 MiB demandent plus que
    // le plafond. Le budget protège le cas mobile courant, pas tous les cas.
    const besoin300k = (COMPOSER_MEDIA_MAX_BYTES * 8 * 1000) / 300_000;
    expect(besoin300k).toBeGreaterThan(COMPOSER_MEDIA_UPLOAD_TIMEOUT_CAP_MS);
  });
});
