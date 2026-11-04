import { guardNavigation } from "@/lib/navigation/leave-guard";

type CreateHubRouter = {
  push: (href: string) => void;
};

/**
 * Navigation depuis une action du Create Hub.
 *
 * Passe par `guardNavigation` : un écran porteur d'un brouillon (`/feed/new`)
 * doit pouvoir confirmer la sortie avant que le hub ne l'emmène ailleurs.
 * Choisir l'action de la page déjà ouverte ne navigue pas — le brouillon en
 * cours n'est ni rechargé ni mis en jeu.
 */
export function navigateFromCreateHub(
  href: string,
  options: {
    pathname: string;
    router: CreateHubRouter;
  },
): void {
  if (href === options.pathname) return;
  guardNavigation(() => options.router.push(href));
}
