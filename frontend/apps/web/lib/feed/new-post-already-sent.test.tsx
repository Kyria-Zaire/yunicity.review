// @vitest-environment jsdom

/**
 * FEED-NEW-UX-01 — 409 `POST_REQUEST_CONFLICT` et issue indéterminée.
 *
 * §3.4 bis du contrat : ces deux états ne s'annoncent ni comme un succès ni
 * comme un échec, et ⛔ aucun ne déclenche de republication automatique.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NewPostAlreadySent } from "@/components/feed/post-composer/new-post-already-sent";
import { NewPostUndetermined } from "@/components/feed/post-composer/new-post-undetermined";

afterEach(cleanup);

describe("publication déjà partie", () => {
  it("explique la situation et n'offre AUCUN réessai", () => {
    render(<NewPostAlreadySent onOpenFeed={vi.fn()} onStartNew={vi.fn()} />);
    expect(screen.getByText("Cette publication a déjà été envoyée.")).toBeTruthy();
    // Rejouer ne produirait qu'un second refus : la publication EXISTE.
    expect(screen.queryByRole("button", { name: /Réessayer/ })).toBeNull();
  });

  it("mène au fil", () => {
    const onOpenFeed = vi.fn();
    render(<NewPostAlreadySent onOpenFeed={onOpenFeed} onStartNew={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le fil" }));
    expect(onOpenFeed).toHaveBeenCalledTimes(1);
  });

  it("ne libère la clé que sur un geste explicite de l'utilisateur", () => {
    const onStartNew = vi.fn();
    render(<NewPostAlreadySent onOpenFeed={vi.fn()} onStartNew={onStartNew} />);
    fireEvent.click(screen.getByRole("button", { name: "Créer une nouvelle publication" }));
    expect(onStartNew).toHaveBeenCalledTimes(1);
  });

  it("est signalée aux technologies d'assistance", () => {
    render(<NewPostAlreadySent onOpenFeed={vi.fn()} onStartNew={vi.fn()} />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});

describe("issue indéterminée", () => {
  it("n'annonce NI échec NI succès", () => {
    render(<NewPostUndetermined onRetry={vi.fn()} onOpenFeed={vi.fn()} />);
    const texte = screen.getByRole("status").textContent ?? "";
    expect(texte).not.toMatch(/a bien été envoyée|brouillon restauré/i);
    expect(screen.getByText("Nous n'avons pas pu confirmer l'envoi.")).toBeTruthy();
  });

  it("offre « Réessayer » en action primaire", () => {
    const onRetry = vi.fn();
    render(<NewPostUndetermined onRetry={onRetry} onOpenFeed={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Réessayer l'envoi" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("mène au fil en action secondaire", () => {
    const onOpenFeed = vi.fn();
    render(<NewPostUndetermined onRetry={vi.fn()} onOpenFeed={onOpenFeed} />);
    fireEvent.click(screen.getByRole("button", { name: "Vérifier dans le fil" }));
    expect(onOpenFeed).toHaveBeenCalledTimes(1);
  });

  it("⛔ n'offre JAMAIS « Abandonner » seul — il promettrait une annulation", () => {
    render(<NewPostUndetermined onRetry={vi.fn()} onOpenFeed={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Abandonner" })).toBeNull();
  });
});
