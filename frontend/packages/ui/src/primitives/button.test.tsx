import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type FormEvent } from "react";
import { describe, expect, it, vi } from "vitest";

import { Button, ButtonLink } from "./button";

// Aucun matcher jest-dom (dépendance non retenue) : assertions DOM natives explicites.

describe("Button", () => {
  it("déclenche l'action une seule fois par clic", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Publier</Button>);

    await user.click(screen.getByRole("button", { name: "Publier" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("n'est pas cliquable quand il est désactivé", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Publier
      </Button>,
    );

    const button = screen.getByRole<HTMLButtonElement>("button", { name: "Publier" });
    expect(button.disabled).toBe(true);
    await user.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("expose aria-busy et neutralise l'interaction pendant le chargement", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} loading>
        Publier
      </Button>,
    );

    const button = screen.getByRole<HTMLButtonElement>("button", { name: /Publier/ });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.disabled).toBe(true);

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("ne double-mute pas si l'utilisateur reclique pendant le chargement", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();

    function SubmitOnce() {
      const [pending, setPending] = useState(false);
      return (
        <Button
          loading={pending}
          onClick={() => {
            setPending(true);
            mutate();
          }}
        >
          Envoyer
        </Button>
      );
    }

    render(<SubmitOnce />);
    const button = screen.getByRole("button", { name: /Envoyer/ });

    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("ignore un déclenchement programmatique pendant le chargement", () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} loading>
        Envoyer
      </Button>,
    );

    // `disabled` bloque déjà l'utilisateur ; la garde interne couvre l'appel direct.
    screen.getByRole("button", { name: /Envoyer/ }).click();

    expect(onClick).not.toHaveBeenCalled();
  });

  it("donne un nom accessible à un bouton icône seule", () => {
    render(
      <Button iconOnly aria-label="Fermer le panneau" onClick={() => undefined}>
        <svg aria-hidden="true" />
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Fermer le panneau" })).not.toBeNull();
  });

  it("conserve la sémantique submit dans un formulaire", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Enregistrer</Button>
      </form>,
    );

    const button = screen.getByRole("button", { name: "Enregistrer" });
    expect(button.getAttribute("type")).toBe("submit");
    await user.click(button);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("conserve la sémantique reset", async () => {
    const user = userEvent.setup();

    render(
      <form>
        <input aria-label="Titre" defaultValue="" />
        <Button type="reset">Réinitialiser</Button>
      </form>,
    );

    const input = screen.getByLabelText<HTMLInputElement>("Titre");
    await user.type(input, "brouillon");
    expect(input.value).toBe("brouillon");

    await user.click(screen.getByRole("button", { name: "Réinitialiser" }));
    expect(input.value).toBe("");
  });
});

describe("ButtonLink", () => {
  it("est un lien avec une destination réelle", () => {
    render(<ButtonLink href="/tribes/new">Créer une tribu</ButtonLink>);

    const link = screen.getByRole("link", { name: "Créer une tribu" });
    expect(link.getAttribute("href")).toBe("/tribes/new");
    expect(link.tagName).toBe("A");
  });

  it("reste focalisable quand il est actif", async () => {
    const user = userEvent.setup();
    render(<ButtonLink href="/tribes/new">Créer une tribu</ButtonLink>);

    await user.tab();

    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Créer une tribu" }));
  });

  it("sort de l'ordre de tabulation quand il est inactif", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ButtonLink href="/tribes/new" loading>
          Créer une tribu
        </ButtonLink>
        <button type="button">Après</button>
      </>,
    );

    const link = screen.getByRole("link", { name: /Créer une tribu/ });
    expect(link.getAttribute("aria-disabled")).toBe("true");
    expect(link.getAttribute("tabindex")).toBe("-1");

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Après" }));
  });

  it("ne navigue pas quand il est inactif", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <ButtonLink href="/tribes/new" loading onClick={onClick}>
        Créer une tribu
      </ButtonLink>,
    );

    await user.click(screen.getByRole("link", { name: /Créer une tribu/ }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
