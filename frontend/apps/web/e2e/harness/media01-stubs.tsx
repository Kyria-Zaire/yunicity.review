/**
 * MEDIA-01 — GATE 9 : bouchons du harnais de rendu.
 *
 * Remplacent UNIQUEMENT la session, l'accès réseau et la navigation. Aucun
 * composant, aucune classe, aucun balisage n'est simulé : c'est ce qui rend la
 * mesure de mise en page valable.
 */

import type { ReactNode } from "react";

type ModeHarnais = "resolve" | "pending";

declare global {
  interface Window {
    media01Mode?: ModeHarnais;
  }
}

/** Image large générée dans le navigateur : éprouve réellement le confinement. */
function imageLargeDataUrl(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 900;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#2A2FFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, 40);
  }
  return canvas.toDataURL("image/png");
}

export function useYunicityApi() {
  return {
    uploadPostMedia: async (): Promise<{ url: string }> => {
      if (window.media01Mode === "pending") {
        return new Promise<{ url: string }>(() => {
          /* jamais résolu : fige l'état « envoi en cours » */
        });
      }
      return { url: imageLargeDataUrl() };
    },
    getProfileMe: async (): Promise<{ full_name: string; avatar_url: string | null }> => ({
      full_name: "Citoyenne QA",
      avatar_url: null,
    }),
  };
}

export function useAuth() {
  return { user: { email: "citoyenne@exemple.test" } };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useRouter() {
  return { push: () => {}, replace: () => {}, back: () => {}, refresh: () => {} };
}

export function useSearchParams() {
  return { get: () => null };
}

export function usePathname() {
  return "/";
}

export function AvatarImage() {
  return null;
}

/** Chrome de page du parcours `/feed/new` — hors sujet pour une mesure de mise en page. */
export function CitizenTopNav() {
  return null;
}

export function WebSidebar() {
  return null;
}

export function YunicityLogo() {
  return null;
}

/** `next/image` et `next/link` ne rendent rien d'utile hors du runtime Next. */
export default function ImageOuLien() {
  return null;
}
