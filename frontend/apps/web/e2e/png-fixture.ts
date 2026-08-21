import { deflateSync } from "node:zlib";

/**
 * Génération PNG in-memory pour fixtures E2E (C3.1-R1D).
 *
 * Permet de fabriquer une image aux dimensions naturelles EXACTES sans asset repo,
 * afin de vérifier qu'un média n'est pas recadré (contrat R1C) sur des consommateurs
 * dont la donnée n'existe pas dans le seed QA (organisation, événement).
 */

function crc32(buf: Buffer): number {
  // CRC32 (IEEE 802.3), polynôme 0xEDB88320
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]!;
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** PNG RGB 8 bits, couleur unie, dimensions exactes. */
export function makeSolidPngBuffer(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number,
): Buffer {
  const rowSize = 1 + width * 3; // octet de filtre + pixels RGB
  const raw = Buffer.allocUnsafe(rowSize * height);
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset] = 0x00; // filtre : none
    offset += 1;
    for (let x = 0; x < width; x++) {
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profondeur
  ihdr[9] = 2; // type couleur RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filtre
  ihdr[12] = 0; // entrelacement

  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function makeSolidPngDataUri(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number,
): string {
  return `data:image/png;base64,${makeSolidPngBuffer(width, height, r, g, b).toString("base64")}`;
}
