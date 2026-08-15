export { colors, radius, spacing, yunicityBrand } from "./tokens";
export { yunicityBrand as brand, type YunicityBrand } from "./brand-tokens";
export { yunicityTailwindExtend } from "./tailwind-preset";
export { yunicitySemantic, type YunicitySemantic } from "./semantic-tokens";

// Les primitives React (C3.0-T3) sont DOM et ne sont volontairement PAS réexportées ici :
// `apps/mobile` consomme cette racine pour les tokens. Web/admin : `@yunicity/ui/primitives`.
