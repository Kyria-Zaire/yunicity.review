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
  options.router.push(href);
}
