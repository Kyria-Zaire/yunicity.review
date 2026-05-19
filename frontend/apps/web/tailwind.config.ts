import { yunicityTailwindExtend } from "@yunicity/ui/tailwind-preset";
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      ...yunicityTailwindExtend,
    },
  },
  plugins: [],
};

export default config;
