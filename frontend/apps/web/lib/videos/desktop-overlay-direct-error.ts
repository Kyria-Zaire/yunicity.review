/**
 * VIDEO-REFONTE-L9 — classification ouverture directe desktop (C4 / C7 / auth).
 * Pure : testable hors React.
 */

import { isLocalVideoError, toLocalVideoError } from "@yunicity/utils";

export type DesktopOverlayDirectErrorKind = "unavailable" | "load_error" | "auth";

export type DesktopOverlayDirectError = {
  kind: DesktopOverlayDirectErrorKind;
  status: number;
  code: string;
};

/** Libellés maquette C4 / C7 (français UI). */
export const DESKTOP_OVERLAY_DIRECT_LABELS = {
  unavailableTitle: "Cette vidéo n'est plus disponible",
  unavailableBody: "Le lien que vous avez suivi ne mène plus à une vidéo.",
  seeOtherVideos: "Voir les autres vidéos",
  loadErrorTitle: "Impossible de charger la vidéo",
  loadErrorBody: "Vérifiez votre connexion, puis réessayez.",
  retry: "Réessayer",
  close: "Fermer",
} as const;

function readErrorShape(error: unknown): { status: number; code: string } {
  if (isLocalVideoError(error)) {
    return { status: error.status, code: error.code };
  }
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    "code" in error &&
    typeof (error as { status: unknown }).status === "number" &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    return {
      status: (error as { status: number }).status,
      code: (error as { code: string }).code,
    };
  }
  const normalized = toLocalVideoError(error);
  return { status: normalized.status, code: normalized.code };
}

/**
 * Distingue 404 indisponible (C4), auth/session (D2 / session expirée),
 * et toute autre erreur (C7).
 */
export function classifyDesktopOverlayDirectError(error: unknown): DesktopOverlayDirectError {
  const { status, code } = readErrorShape(error);
  if (status === 401 || code === "UNAUTHORIZED") {
    return { kind: "auth", status: status || 401, code };
  }
  if (status === 404 || code === "LOCAL_VIDEO_NOT_FOUND") {
    return {
      kind: "unavailable",
      status: status || 404,
      code: code || "LOCAL_VIDEO_NOT_FOUND",
    };
  }
  return { kind: "load_error", status, code };
}
