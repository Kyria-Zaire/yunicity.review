"use client";

import { useEffect, useState } from "react";

import { passportQrSvgDataUrl } from "@/lib/passport/passport-qr-image";

type QrImageState = { value: string; src: string | null; failed: boolean };

/**
 * Image d'un QR Passport, générée localement (`passportQrSvgDataUrl`).
 *
 * - `generating` : une valeur est présente et son image n'est pas encore prête ;
 * - `failed` : la génération a échoué — l'écran affiche son état d'erreur,
 *   **sans repli** vers un service externe.
 * Une image n'est jamais rendue pour une autre valeur que la valeur courante.
 */
export function usePassportQrImage(value: string | null): {
  src: string | null;
  generating: boolean;
  failed: boolean;
} {
  const [state, setState] = useState<QrImageState | null>(null);

  useEffect(() => {
    if (!value) {
      setState(null);
      return;
    }
    let annule = false;
    setState({ value, src: null, failed: false });
    passportQrSvgDataUrl(value)
      .then((src) => {
        if (!annule) setState({ value, src, failed: false });
      })
      .catch(() => {
        if (!annule) setState({ value, src: null, failed: true });
      });
    return () => {
      annule = true;
    };
  }, [value]);

  const courant = value !== null && state?.value === value ? state : null;
  return {
    src: courant?.src ?? null,
    generating: value !== null && (courant === null || (courant.src === null && !courant.failed)),
    failed: courant?.failed ?? false,
  };
}
