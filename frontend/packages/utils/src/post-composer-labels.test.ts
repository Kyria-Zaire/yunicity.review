import { describe, expect, it } from "vitest";
import {
  POST_NEW_INVALID_TYPE,
  POST_NEW_LEAVE_NO_CANCEL_CONFIRM,
  POST_NEW_LEAVE_NO_CANCEL_HINT,
  POST_NEW_LEAVE_NO_CANCEL_TITLE,
  POST_NEW_MEDIA_COUNT,
  POST_NEW_MEDIA_POSITION,
  POST_NEW_PENDING_KEY_NOTICE,
  POST_NEW_START_NEW_PUBLICATION,
  POST_NEW_TITLE,
  POST_NEW_UNDETERMINED_CHECK_FEED,
  POST_NEW_UNDETERMINED_HINT,
  POST_NEW_UNDETERMINED_RETRY,
  POST_NEW_UNDETERMINED_TITLE,
  POST_NEW_UPLOAD_PROGRESS,
} from "./post-composer-labels";

describe("libellés du composeur de publication", () => {
  it("nomme l'écran en français correct", () => {
    // « Nouveau poste » désignait un emploi, pas une publication.
    expect(POST_NEW_TITLE).toBe("Créer une publication");
  });

  it("calcule le compteur de médias", () => {
    expect(POST_NEW_MEDIA_COUNT(5, 10)).toBe("5 médias sur 10");
    expect(POST_NEW_MEDIA_COUNT(1, 10)).toBe("1 média sur 10");
  });

  it("annonce la position d'un média", () => {
    expect(POST_NEW_MEDIA_POSITION(3, 5)).toBe("Média 3 sur 5");
  });

  it("annonce la progression d'envoi", () => {
    expect(POST_NEW_UPLOAD_PROGRESS(3, 5)).toBe("Envoi 3 sur 5");
  });

  it("annonce les types réellement acceptés, vidéos comprises", () => {
    // Le message partagé des stories dit « JPEG, PNG ou WebP uniquement » :
    // faux ici, où mp4 et webm sont acceptés.
    expect(POST_NEW_INVALID_TYPE).toContain("vidéo");
  });
});

/**
 * §3.4 bis du contrat : quand aucune réponse ne revient, personne ne sait si la
 * publication existe. La microcopie doit NOMMER cette incertitude et renvoyer
 * au fil — jamais affirmer un état que personne ne connaît.
 */
describe("issue indéterminée — la microcopie n'affirme rien", () => {
  const interdits = [
    /brouillon\s+(a été\s+)?(restauré|récupéré)/i,
    /nous avons retrouvé/i,
    /a bien été envoyée/i,
    /publication envoyée/i,
  ];

  it("n'annonce jamais un échec ni un succès", () => {
    const ensemble = [
      POST_NEW_UNDETERMINED_TITLE,
      POST_NEW_UNDETERMINED_HINT,
      POST_NEW_PENDING_KEY_NOTICE,
    ];
    for (const texte of ensemble) {
      for (const interdit of interdits) {
        expect(texte, `formule interdite dans « ${texte} »`).not.toMatch(interdit);
      }
    }
  });

  it("nomme l'incertitude plutôt que de rassurer", () => {
    expect(POST_NEW_UNDETERMINED_TITLE).toMatch(/pas (pu )?confirm|incertain|sait pas/i);
    expect(POST_NEW_UNDETERMINED_HINT).toMatch(/fil/i);
  });

  it("offre « Réessayer » en action primaire et le fil en secondaire", () => {
    expect(POST_NEW_UNDETERMINED_RETRY).toBe("Réessayer l'envoi");
    expect(POST_NEW_UNDETERMINED_CHECK_FEED).toBe("Vérifier dans le fil");
  });

  it("dit que quitter n'annule pas — jamais « Abandonner » seul", () => {
    expect(POST_NEW_LEAVE_NO_CANCEL_TITLE).toMatch(/n['’]annule pas/i);
    expect(POST_NEW_LEAVE_NO_CANCEL_HINT).toMatch(/fil/i);
    expect(POST_NEW_LEAVE_NO_CANCEL_CONFIRM).not.toBe("Abandonner");
  });

  it("annonce la clé retrouvée comme une protection limitée, sans restituer de contenu", () => {
    expect(POST_NEW_PENDING_KEY_NOTICE).toMatch(/texte|médias|contenu/i);
    expect(POST_NEW_PENDING_KEY_NOTICE).toMatch(/fil/i);
  });

  it("nomme le geste explicite qui libère la clé", () => {
    expect(POST_NEW_START_NEW_PUBLICATION).toBe("Créer une nouvelle publication");
  });
});
