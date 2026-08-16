import { yunicityTailwindExtend } from "@yunicity/ui/tailwind-preset";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    // Primitives partagées (C3.0-T3) : sans ce glob, leurs classes seraient purgées et les
    // composants rendus sans style. Aucun effet sur le CSS existant tant qu'aucune page ne
    // les consomme — mesuré sur ce build : 0 sélecteur existant perdu, +3,2 ko de règles
    // nouvelles, toutes inutilisées tant qu'aucun consommateur n'est migré.
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      ...yunicityTailwindExtend,
    },
  },
  plugins: [],
};

export default config;
