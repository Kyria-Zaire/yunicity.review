import QRCode from "qrcode";

/**
 * PASSPORT-QR-THIRD-PARTY-01 — image du QR générée SUR L'APPAREIL.
 *
 * Le contenu d'un QR Passport est un jeton porteur (`YNCP1:<token>` citoyen,
 * URL de réclamation avec JWT de tampon côté partenaire). Il était envoyé à
 * `api.qrserver.com` pour être rendu en image : il ne doit plus quitter
 * l'appareil. Le SVG est rendu en `data:` (autorisé par `img-src`).
 *
 * La valeur est encodée TELLE QUELLE : aucune normalisation, aucun préfixe.
 */
export async function passportQrSvgDataUrl(value: string): Promise<string> {
  const svg = await QRCode.toString(value, { type: "svg", errorCorrectionLevel: "M", margin: 1 });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
