// @vitest-environment jsdom

/**
 * FEED-NEW-UX-01 — en-tête, ligne d'auteur, zone de texte.
 *
 * Une seule action primaire par écran : l'ancien composeur montait deux arbres
 * (mobile + desktop) départagés par CSS, et exposait donc DEUX boutons
 * « Publier » à l'arbre d'accessibilité.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NewPostAuthorLine } from "@/components/feed/post-composer/new-post-author-line";
import { NewPostBodyField } from "@/components/feed/post-composer/new-post-body-field";
import { NewPostHeader } from "@/components/feed/post-composer/new-post-header";

// Aucun `setupFiles` dans ce runner : sans nettoyage explicite, les rendus
// s'accumulent et « une seule action primaire » ne veut plus rien dire.
afterEach(cleanup);

describe("NewPostHeader", () => {
  it("active Publier quand un texte seul est valide", () => {
    render(
      <NewPostHeader
        canPublish
        submitting={false}
        progressLabel={null}
        onBack={vi.fn()}
        onPublish={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Publier" })).not.toHaveProperty("disabled", true);
  });

  it("désactive Publier quand rien n'est publiable", () => {
    render(
      <NewPostHeader
        canPublish={false}
        submitting={false}
        progressLabel={null}
        onBack={vi.fn()}
        onPublish={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Publier" })).toHaveProperty("disabled", true);
  });

  it("désactive Publier pendant l'envoi — le verrou est aussi visuel", () => {
    render(
      <NewPostHeader
        canPublish
        submitting
        progressLabel="Envoi 1 sur 2"
        onBack={vi.fn()}
        onPublish={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Publier" })).toHaveProperty("disabled", true);
  });

  it("annonce la progression pendant l'envoi", () => {
    render(
      <NewPostHeader
        canPublish
        submitting
        progressLabel="Envoi 3 sur 5"
        onBack={vi.fn()}
        onPublish={vi.fn()}
      />,
    );
    expect(screen.getByText("Envoi 3 sur 5")).toBeTruthy();
  });

  it("n'expose qu'UNE action primaire", () => {
    render(
      <NewPostHeader
        canPublish
        submitting={false}
        progressLabel={null}
        onBack={vi.fn()}
        onPublish={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("button", { name: "Publier" })).toHaveLength(1);
  });

  it("offre un retour nommé, atteignable", () => {
    const onBack = vi.fn();
    render(
      <NewPostHeader
        canPublish={false}
        submitting={false}
        progressLabel={null}
        onBack={onBack}
        onPublish={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("NewPostAuthorLine", () => {
  it("mentionne l'audience publique sans en faire un choix", () => {
    render(<NewPostAuthorLine authorLabel="Kyria" avatarUrl={null} />);
    expect(screen.getByText("Publication publique")).toBeTruthy();
    // Aucune autre audience n'existe côté serveur : un bouton mentirait.
    expect(screen.queryByRole("button", { name: /Publication publique/ })).toBeNull();
  });
});

describe("NewPostBodyField", () => {
  it("est étiquetée et porte le compteur de caractères", () => {
    render(<NewPostBodyField value="Bonjour" onChange={vi.fn()} city="Reims" charCount={7} locked={false} />);
    expect(screen.getByLabelText(/Quoi de neuf à Reims/)).toBeTruthy();
    expect(screen.getByText("7 / 2200")).toBeTruthy();
  });

  it("remonte chaque frappe", () => {
    const onChange = vi.fn();
    render(<NewPostBodyField value="" onChange={onChange} city="Reims" charCount={0} locked={false} />);
    fireEvent.change(screen.getByLabelText(/Quoi de neuf à Reims/), {
      target: { value: "Bonjour Reims" },
    });
    expect(onChange).toHaveBeenCalledWith("Bonjour Reims");
  });
});
