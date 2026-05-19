// Retire l'entrée ".next/types" ajoutée par next lint/build dans tsconfig.json.
// À exécuter avant pnpm typecheck si Next a réécrit les tsconfig.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apps = ["web", "admin"];

const FORBIDDEN = ".next/types/**/*.ts"; // eslint-disable-line -- literal glob string

for (const app of apps) {
  const file = path.join(root, "apps", app, "tsconfig.json");
  if (!fs.existsSync(file)) {
    continue;
  }
  const raw = fs.readFileSync(file, "utf8");
  const json = JSON.parse(raw);
  if (!Array.isArray(json.include)) {
    continue;
  }
  const nextInclude = json.include.filter((entry) => entry !== FORBIDDEN);
  if (nextInclude.length === json.include.length) {
    continue;
  }
  json.include = nextInclude;
  if (!Array.isArray(json.exclude)) {
    json.exclude = ["node_modules"];
  }
  for (const dir of [".next", ".next-build"]) {
    if (!json.exclude.includes(dir)) {
      json.exclude.push(dir);
    }
  }
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  console.log(`normalize-next-tsconfig: cleaned ${app}/tsconfig.json`);
}
