import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Card, CardContent, CardFooter, CardHeader } from "./card";

describe("Card", () => {
  it("compose une structure header / content / footer", () => {
    render(
      <Card>
        <CardHeader>
          <h3>Concert au Cryptoportique</h3>
        </CardHeader>
        <CardContent>Samedi 20h</CardContent>
        <CardFooter>2 places</CardFooter>
      </Card>,
    );

    expect(screen.getByRole("heading", { name: "Concert au Cryptoportique" })).not.toBeNull();
    expect(screen.getByText("Samedi 20h")).not.toBeNull();
    expect(screen.getByText("2 places")).not.toBeNull();
  });

  it("par défaut : conteneur non interactif", () => {
    const { container } = render(<Card>Contenu</Card>);

    const card = container.firstElementChild;
    expect(card?.tagName).toBe("DIV");
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(card?.getAttribute("tabindex")).toBeNull();
    expect(card?.getAttribute("onclick")).toBeNull();
  });

  it("applique la variante elevated sans changer la sémantique", () => {
    const { container } = render(<Card variant="elevated">Contenu</Card>);

    const card = container.firstElementChild;
    expect(card?.tagName).toBe("DIV");
    expect(card?.className).toContain("shadow-yunicity-md");
  });

  it("premium utilise la surface navy pleine, sans gradient", () => {
    const { container } = render(<Card variant="premium">Passport</Card>);

    const className = container.firstElementChild?.className ?? "";
    expect(className).toContain("bg-yunicity-premium");
    expect(className).not.toMatch(/gradient|backdrop-blur/);
  });

  it("interactive + href : c'est un lien avec une vraie destination", () => {
    render(
      <Card variant="interactive" href="/events/42" ariaLabel="Voir l'événement">
        Concert
      </Card>,
    );

    const link = screen.getByRole("link", { name: "Voir l'événement" });
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/events/42");
  });

  it("interactive + onClick : c'est un bouton qui déclenche l'action", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Card variant="interactive" onClick={onClick} ariaLabel="Ouvrir la fiche">
        Concert
      </Card>,
    );

    const button = screen.getByRole("button", { name: "Ouvrir la fiche" });
    expect(button.tagName).toBe("BUTTON");
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("est activable au clavier et porte un focus visible", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Card variant="interactive" onClick={onClick} ariaLabel="Ouvrir la fiche">
        Concert
      </Card>,
    );

    const button = screen.getByRole("button", { name: "Ouvrir la fiche" });
    await user.tab();
    expect(document.activeElement).toBe(button);
    expect(button.className).toContain("focus-visible:ring-yunicity-focus");

    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("ne produit jamais une div interactive : toute carte cliquable est bouton ou lien", () => {
    const { container: withHref } = render(
      <Card variant="interactive" href="/a">
        A
      </Card>,
    );
    const { container: withClick } = render(
      <Card variant="interactive" onClick={() => undefined}>
        B
      </Card>,
    );

    expect(withHref.firstElementChild?.tagName).toBe("A");
    expect(withClick.firstElementChild?.tagName).toBe("BUTTON");
    // Le type interdit `variant="interactive"` sans href ni onClick : aucune div cliquable
    // n'est représentable, il n'y a donc pas de cas runtime à couvrir.
  });
});
