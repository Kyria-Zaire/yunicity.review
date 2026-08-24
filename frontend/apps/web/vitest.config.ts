import path from "node:path";
import { defineConfig } from "vitest/config";

// Transposé tel quel depuis apps/admin/vitest.config.ts (#138 étape 3).
//
// environment: "node" — ce runner couvre la LOGIQUE PURE de lib/ (17 des 19 modules n'ont
// aucun import next/react). Tester des composants React demanderait en plus jsdom et
// @testing-library : chantier séparé, à ouvrir le jour où ce besoin existe réellement.
export default defineConfig({
  test: {
    environment: "node",
    // `scripts/` : outillage de harnais E2E en ESM pur (le proxy QA tourne sous
    // node sans transpilation TS). Son contrat de bind est du code de securite :
    // il doit etre couvert par le runner, pas seulement relu.
    include: ["lib/**/*.test.ts", "scripts/**/*.test.mjs"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
