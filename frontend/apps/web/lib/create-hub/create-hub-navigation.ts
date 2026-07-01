import { CREATE_HUB_FEED_COMPOSER_HREF } from "@/lib/create-hub/create-hub-actions";
import { focusFeedComposer } from "@/lib/create-hub/focus-feed-composer";

type CreateHubRouter = {
  push: (href: string) => void;
};

export function navigateFromCreateHub(
  href: string,
  options: {
    pathname: string;
    router: CreateHubRouter;
  },
): void {
  if (href === CREATE_HUB_FEED_COMPOSER_HREF) {
    if (options.pathname === "/feed") {
      focusFeedComposer();
      return;
    }
    options.router.push(href);
    return;
  }

  options.router.push(href);
}
