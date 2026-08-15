import { defineConfig } from "vitest/config";

/**
 * environment: "jsdom" (C3.0-T3-R1) — les primitives sont des composants DOM : leurs
 * comportements (focus, Escape, clic overlay, inert) ne se prouvent pas en environnement node.
 *
 * jsdom reste sur ses DÉFAUTS SÛRS : `runScripts` et le chargement de ressources distantes
 * ne sont PAS activés — aucun script de page n'est exécuté, aucune requête réseau n'est émise
 * (`vitest.setup.ts` interdit `fetch` explicitement).
 */
export default defineConfig({
  // Le tsconfig du monorepo est en `jsx: "preserve"` (c'est Next qui transforme en prod).
  // Hors Next, on demande explicitement la transformée automatique React 17+, sinon esbuild
  // retomberait sur `React.createElement` et exigerait un import React dans chaque fichier.
  esbuild: { jsx: "automatic" },
  // Copie unique de React : `packages/ui` déclare react/react-dom 18.3.1 en devDependencies,
  // ce qui force pnpm à résoudre les peers de @testing-library/react sur le React du
  // workspace (celui de web et admin) au lieu du React 19 d'Expo. `dedupe` verrouille en plus
  // la résolution côté runner.
  resolve: { dedupe: ["react", "react-dom"] },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    restoreMocks: true,
  },
});
