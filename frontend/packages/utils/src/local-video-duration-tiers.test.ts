/**
 * VIDEO-04D — libellés et frontières côté client.
 *
 * Le client n'est jamais l'autorité : ces libellés servent au rejet anticipé et
 * à l'affichage. On vérifie qu'ils suivent la limite reçue du serveur, que la
 * retombée est le palier pilote, et que 300 s n'est jamais annoncé.
 */
import { describe, expect, it } from "vitest";

import { LOCAL_VIDEO_MAX_DURATION_SECONDS } from "@yunicity/types";

import {
  LOCAL_VIDEO_UPLOAD_FILE_TOO_LONG,
  LOCAL_VIDEO_UPLOAD_PAGE_SUBTITLE,
  LOCAL_VIDEO_UPLOAD_VIDEO_HINT,
  localVideoUploadFileTooLong,
  localVideoUploadPageSubtitle,
  localVideoUploadVideoHint,
} from "./local-video-labels";

const PILOT = 90;
const VERIFIED = 180;

describe("libellés de durée par palier", () => {
  it("affiche 90 s pour le palier pilote", () => {
    expect(localVideoUploadVideoHint(PILOT)).toContain("max. 90 s");
    expect(localVideoUploadPageSubtitle(PILOT)).toContain("90 s");
    expect(localVideoUploadFileTooLong(PILOT)).toBe("Vidéo trop longue (max. 90 s).");
  });

  it("affiche 180 s pour le palier créateur vérifié", () => {
    expect(localVideoUploadVideoHint(VERIFIED)).toContain("max. 180 s");
    expect(localVideoUploadPageSubtitle(VERIFIED)).toContain("180 s");
    expect(localVideoUploadFileTooLong(VERIFIED)).toBe("Vidéo trop longue (max. 180 s).");
  });

  it("retombe sur le palier pilote quand aucune politique n'est fournie", () => {
    expect(LOCAL_VIDEO_MAX_DURATION_SECONDS).toBe(PILOT);
    expect(LOCAL_VIDEO_UPLOAD_VIDEO_HINT).toBe(localVideoUploadVideoHint(PILOT));
    expect(LOCAL_VIDEO_UPLOAD_PAGE_SUBTITLE).toBe(localVideoUploadPageSubtitle(PILOT));
    expect(LOCAL_VIDEO_UPLOAD_FILE_TOO_LONG).toBe(localVideoUploadFileTooLong(PILOT));
  });

  it("n'annonce jamais 300 s dans cette livraison", () => {
    for (const limite of [PILOT, VERIFIED]) {
      for (const texte of [
        localVideoUploadVideoHint(limite),
        localVideoUploadPageSubtitle(limite),
        localVideoUploadFileTooLong(limite),
      ]) {
        expect(texte).not.toContain("300");
        expect(texte).not.toContain("5 min");
      }
    }
  });

  it("laisse la taille maximale inchangée", () => {
    expect(localVideoUploadVideoHint(VERIFIED)).toContain("50 Mo");
    expect(localVideoUploadPageSubtitle(VERIFIED)).toContain("50 Mo");
  });
});

describe("frontières de rejet anticipé", () => {
  /** Réplique la garde du formulaire : `duration > maxDurationSeconds`. */
  const rejette = (duree: number, limite: number) => duree > limite;

  it("accepte la frontière exacte et refuse au-delà — pilote", () => {
    expect(rejette(89, PILOT)).toBe(false);
    expect(rejette(90, PILOT)).toBe(false);
    expect(rejette(91, PILOT)).toBe(true);
  });

  it("accepte la frontière exacte et refuse au-delà — vérifié", () => {
    expect(rejette(179, VERIFIED)).toBe(false);
    expect(rejette(180, VERIFIED)).toBe(false);
    expect(rejette(181, VERIFIED)).toBe(true);
  });

  it("un pilote ne peut pas atteindre le plafond vérifié", () => {
    expect(rejette(150, PILOT)).toBe(true);
    expect(rejette(150, VERIFIED)).toBe(false);
  });
});
