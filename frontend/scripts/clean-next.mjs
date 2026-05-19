/**
 * Supprime les caches Next.js (web + admin). Cross-platform (Node fs).
 *
 * Usage:
 *   node scripts/clean-next.mjs
 *   pnpm clean:next
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targets = [
  "apps/web/.next",
  "apps/web/.next-build",
  "apps/admin/.next",
  "apps/admin/.next-build",
  "node_modules/.cache",
  "apps/web/node_modules/.cache",
  "apps/admin/node_modules/.cache",
];

for (const rel of targets) {
  const dir = path.join(root, rel);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`clean-next: removed ${rel}`);
  } else {
    console.log(`clean-next: skip (missing) ${rel}`);
  }
}
