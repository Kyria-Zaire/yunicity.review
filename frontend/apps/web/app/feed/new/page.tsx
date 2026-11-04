import { NewPostScreen } from "@/components/feed/post-composer/new-post-screen";
import { ProtectedRoute } from "@/components/protected-route";
import type { Viewport } from "next";

/**
 * Sans `interactiveWidget`, Android Chrome ne redimensionne que le visual
 * viewport : `dvh` ne rétrécit pas quand le clavier s'ouvre, et une barre
 * `fixed` passe SOUS le clavier — le bouton « Publier » devient inatteignable
 * au moment précis où l'utilisateur vient de finir d'écrire.
 *
 * La portée reste cette seule route : l'export vit sur la page, pas sur le
 * layout racine. C'est aussi pourquoi cette page n'est plus `"use client"` —
 * un composant client ne peut pas exporter `viewport`. `ProtectedRoute` reste
 * client et se monte sans difficulté depuis un composant serveur.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function NewFeedPostPage() {
  return (
    <ProtectedRoute>
      <NewPostScreen />
    </ProtectedRoute>
  );
}
