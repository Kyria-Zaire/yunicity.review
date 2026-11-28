// @vitest-environment jsdom

/**
 * FEED-NEW-UX-01 — états complémentaires du composeur.
 *
 * Trois situations que l'ancien écran confondait en un seul message rouge :
 *   - un fichier **refusé à la sélection** : l'utilisateur tranche, rien n'est
 *     parti ;
 *   - un **échec d'envoi** : rejouable, et la reprise ne renvoie que ce qui
 *     manque ;
 *   - un **abandon** : destructif, donc confirmé.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NewPostDiscardDialog } from "@/components/feed/post-composer/new-post-discard-dialog";
import { NewPostRejectedFiles } from "@/components/feed/post-composer/new-post-rejected-files";
import { NewPostUploadFailure } from "@/components/feed/post-composer/new-post-upload-failure";

afterEach(cleanup);

describe("rejets à la sélection", () => {
  it("nomme chaque fichier et son motif", () => {
    render(
      <NewPostRejectedFiles
        files={[
          { name: "IMG_4821.heic", reason: "format HEIC non pris en charge" },
          { name: "reportage.mp4", reason: "28 Mo, maximum 20 Mo" },
        ]}
        onChooseOthers={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText("2 fichiers n'ont pas été ajoutés")).toBeTruthy();
    expect(screen.getByText(/IMG_4821\.heic/)).toBeTruthy();
    expect(screen.getByText(/reportage\.mp4/)).toBeTruthy();
  });

  it("accorde le titre au singulier", () => {
    render(
      <NewPostRejectedFiles
        files={[{ name: "a.heic", reason: "HEIC" }]}
        onChooseOthers={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText("1 fichier n'a pas été ajouté")).toBeTruthy();
  });

  it("rappelle que le brouillon est intact", () => {
    render(
      <NewPostRejectedFiles
        files={[{ name: "a.heic", reason: "HEIC" }]}
        onChooseOthers={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText(/Rien n'a été retiré de votre brouillon/)).toBeTruthy();
  });

  it("laisse choisir d'autres fichiers ou continuer sans eux", () => {
    const onChooseOthers = vi.fn();
    const onDismiss = vi.fn();
    render(
      <NewPostRejectedFiles
        files={[{ name: "a.heic", reason: "HEIC" }]}
        onChooseOthers={onChooseOthers}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Choisir d'autres fichiers" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuer sans eux" }));
    expect(onChooseOthers).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("ne rend rien sans rejet", () => {
    const { container } = render(
      <NewPostRejectedFiles files={[]} onChooseOthers={vi.fn()} onDismiss={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("échec d'envoi", () => {
  const causeMedia = {
    kind: "media" as const,
    mediaKind: "photo" as const,
    rank: 3,
    fileName: "IMG_2034.jpg",
  };

  it("désigne le média par son rang, propose le réessai et dit la portée de la reprise", () => {
    const onRetry = vi.fn();
    render(
      <NewPostUploadFailure
        cause={causeMedia}
        message="Connexion interrompue."
        mediaCount={5}
        hasUploadedMedia
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("L'envoi de la photo 3 a échoué.")).toBeTruthy();
    expect(screen.getByText("Vos 5 médias et votre texte sont conservés.")).toBeTruthy();
    expect(screen.getByText(/IMG_2034\.jpg/)).toBeTruthy();
    expect(screen.getByText(/tant que cet écran reste ouvert/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer l'envoi" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("signale l'échec aux technologies d'assistance", () => {
    render(
      <NewPostUploadFailure
        cause={causeMedia}
        message="Connexion interrompue."
        mediaCount={5}
        hasUploadedMedia={false}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("affiche le message traduit, jamais la réponse brute", () => {
    render(
      <NewPostUploadFailure
        cause={causeMedia}
        message="Le service d'envoi est momentanément indisponible. Réessayez plus tard."
        mediaCount={5}
        hasUploadedMedia={false}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText(/momentanément indisponible/)).toBeTruthy();
  });

  it("I4 — un échec de CRÉATION n'est jamais présenté comme l'envoi d'un fichier", () => {
    render(
      <NewPostUploadFailure
        cause={{ kind: "creation" }}
        message="Vous avez beaucoup publié."
        mediaCount={0}
        hasUploadedMedia={false}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText("La publication n'a pas pu être créée.")).toBeTruthy();
    expect(screen.queryByText(/L'envoi de/)).toBeNull();
    expect(screen.getByText("Votre texte est conservé.")).toBeTruthy();
    // Aucun média : la promesse de non-renvoi n'aurait pas d'objet.
    expect(screen.queryByText(/ne seront pas renvoyés/)).toBeNull();
  });
});

describe("sortie avec un brouillon modifié", () => {
  it("annonce clairement la perte du brouillon et laisse revenir en arrière", () => {
    const onCancel = vi.fn();
    render(<NewPostDiscardDialog open variant="draft" onConfirm={vi.fn()} onCancel={onCancel} />);
    expect(screen.getByText("Quitter sans publier ?")).toBeTruthy();
    expect(screen.getByText("Votre texte et vos médias seront perdus.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continuer la rédaction" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("confirme la sortie sur demande explicite, nommée par sa conséquence", () => {
    const onConfirm = vi.fn();
    render(<NewPostDiscardDialog open variant="draft" onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Quitter et perdre le brouillon" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("I2 — envoi incertain : ne promet AUCUNE annulation", () => {
    render(
      <NewPostDiscardDialog open variant="uncertain" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(screen.getByText("Quitter n'annule pas cet envoi.")).toBeTruthy();
    expect(screen.getByText("Le brouillon affiché ici sera perdu.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Quitter sans vérifier" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Rester sur cet écran" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Abandonner/ })).toBeNull();
    expect(screen.queryByText(/Abandonner/)).toBeNull();
  });

  it("place le focus sur l'action NON destructive", () => {
    render(<NewPostDiscardDialog open variant="draft" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Continuer la rédaction" }),
    );
  });

  it("Échap équivaut à rester", () => {
    const onCancel = vi.fn();
    render(<NewPostDiscardDialog open variant="draft" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("est un dialogue d'alerte modal, nommé et décrit", () => {
    render(<NewPostDiscardDialog open variant="draft" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    const dialogue = screen.getByRole("alertdialog");
    expect(dialogue.getAttribute("aria-modal")).toBe("true");
    expect(dialogue.getAttribute("aria-labelledby")).toBe("new-post-discard-title");
    expect(dialogue.getAttribute("aria-describedby")).toBe("new-post-discard-hint");
  });

  it("ne rend rien quand il est fermé", () => {
    const { container } = render(
      <NewPostDiscardDialog open={false} variant="draft" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("échec d'envoi — révélé une seule fois (recette mobile du 04/11)", () => {
  it("à l'apparition : l'encart est amené à l'écran et reçoit le focus", () => {
    const defiler = vi.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = defiler;
    try {
      render(
        <NewPostUploadFailure
          cause={{ kind: "media", mediaKind: "photo", rank: 3, fileName: "c.jpg" }}
          message="Connexion interrompue."
          mediaCount={5}
          hasUploadedMedia
          onRetry={vi.fn()}
        />,
      );
      expect(defiler).toHaveBeenCalledTimes(1);
      expect(defiler.mock.calls[0]![0]).toMatchObject({ block: "nearest" });
      expect(document.activeElement).toBe(screen.getByRole("alert"));
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it("un nouveau rendu ne redéclenche PAS le défilement", () => {
    const defiler = vi.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = defiler;
    try {
      const props = {
        cause: { kind: "media" as const, mediaKind: "photo" as const, rank: 3, fileName: "c.jpg" },
        mediaCount: 5,
        hasUploadedMedia: true,
        onRetry: vi.fn(),
      };
      const { rerender } = render(<NewPostUploadFailure {...props} message="Premier message." />);
      rerender(<NewPostUploadFailure {...props} message="Message mis à jour." />);
      expect(defiler).toHaveBeenCalledTimes(1);
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });
});
