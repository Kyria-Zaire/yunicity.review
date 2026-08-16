import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Skeleton } from "./skeleton";
import { EmptyState, ErrorState, LoadingState, OfflineState } from "./system-states";

describe("LoadingState", () => {
  it("annonce le chargement en polite et marque aria-busy", () => {
    render(<LoadingState label="Chargement du fil local…" />);

    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("Chargement du fil local…")).not.toBeNull();
  });
});

describe("Skeleton", () => {
  it("est décoratif et respecte prefers-reduced-motion", () => {
    const { container } = render(<Skeleton lines={2} />);

    const root = container.firstElementChild;
    expect(root?.getAttribute("aria-hidden")).toBe("true");

    const bars = root?.querySelectorAll("div") ?? [];
    expect(bars.length).toBe(2);
    for (const bar of bars) {
      expect(bar.className).toContain("animate-pulse");
      expect(bar.className).toContain("motion-reduce:animate-none");
    }
  });
});

describe("EmptyState", () => {
  it("ne rend aucun CTA quand aucune action n'est fournie", () => {
    render(<EmptyState title="Aucune tribu ici" description="Lancez la première." />);

    expect(screen.getByRole("status")).not.toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("rend un lien quand l'action porte une destination", () => {
    render(
      <EmptyState title="Aucune tribu ici" action={{ label: "Créer une tribu", href: "/tribes/new" }} />,
    );

    expect(screen.getByRole("link", { name: "Créer une tribu" }).getAttribute("href")).toBe("/tribes/new");
  });

  it("exécute réellement le handler de l'action", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<EmptyState title="Aucune tribu ici" action={{ label: "Explorer", onClick }} />);

    await user.click(screen.getByRole("button", { name: "Explorer" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("ignore une action sans handler ni destination venue d'un appelant non typé", () => {
    const untyped = { label: "Voir" } as unknown as { label: string; href: string };
    render(<EmptyState title="Aucune tribu ici" action={untyped} />);

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("ErrorState", () => {
  it("est annoncé en alert / assertive", () => {
    render(<ErrorState title="Chargement impossible" description="Réessayez dans un instant." />);

    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("aria-live")).toBe("assertive");
    expect(screen.getByText("Chargement impossible")).not.toBeNull();
  });

  it("ne rend pas de bouton Réessayer sans handler câblé", () => {
    render(<ErrorState title="Chargement impossible" />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("appelle le retry exactement une fois", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ErrorState title="Chargement impossible" onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("accepte un libellé de retry fourni par le consommateur", () => {
    render(<ErrorState title="Erreur" onRetry={() => undefined} retryLabel="Recharger la carte" />);

    expect(screen.getByRole("button", { name: "Recharger la carte" })).not.toBeNull();
  });
});

describe("OfflineState", () => {
  it("est annoncé en status / polite", () => {
    render(<OfflineState title="Vous êtes hors ligne" />);

    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
  });

  it("câble le retry quand il est fourni", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<OfflineState title="Vous êtes hors ligne" onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("ne rend aucun CTA sans retry", () => {
    render(<OfflineState title="Vous êtes hors ligne" />);

    expect(screen.queryByRole("button")).toBeNull();
  });
});
