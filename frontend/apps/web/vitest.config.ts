import path from "node:path";
import { defineConfig } from "vitest/config";

// Transposé tel quel depuis apps/admin/vitest.config.ts (#138 étape 3).
//
// environment: "node" — ce runner couvre la LOGIQUE PURE de lib/ (17 des 19 modules n'ont
// aucun import next/react). Tester des composants React demanderait en plus jsdom et
// @testing-library : chantier séparé, à ouvrir le jour où ce besoin existe réellement.
export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    // `scripts/` : outillage de harnais E2E en ESM pur (le proxy QA tourne sous
    // node sans transpilation TS). Son contrat de bind est du code de securite :
    // il doit etre couvert par le runner, pas seulement relu.
    // Les `.test.tsx` opt-in jsdom via `// @vitest-environment jsdom` en tête de fichier.
    include: ["lib/**/*.test.ts", "lib/**/*.test.tsx", "scripts/**/*.test.mjs"],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname),
      "@yunicity/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),
      "@yunicity/utils": path.resolve(__dirname, "../../packages/utils/src/index.ts"),
      "@yunicity/ui/primitives": path.resolve(__dirname, "../../packages/ui/src/primitives/index.ts"),
      "@yunicity/ui": path.resolve(__dirname, "../../packages/ui/src/index.ts"),
    },
  },
});
