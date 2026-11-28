# Relevé Preview — MEDIA-MULTI-PHOTO-01

> Mesure du coût réel d'une photo sur la Preview, sur **notre publication
> existante** (« Test multi-photo à supprimer », **à conserver**).

## Ce que ce relevé mesure, et ce qu'il ne peut pas mesurer

| | |
|---|---|
| ✅ **Mesuré** | le **nombre** de requêtes média, leur **ordre**, leur **durée** observée, et la variante demandée |
| ⚠️ **Probablement indisponible** | la **taille transférée** — voir l'avertissement ci-dessous |
| ⛔ **Jamais lu** | aucun jeton, aucun en-tête, aucun stockage local. Le relevé n'utilise que `PerformanceResourceTiming`, qui n'expose ni les en-têtes ni les identifiants |

### ⚠️ Pourquoi les tailles seront vraisemblablement indisponibles

`preview.yunicity.city` et `api-preview.yunicity.city` sont **deux origines
différentes**. Pour une ressource d'une autre origine, le navigateur masque le
détail de la chronologie et rend `transferSize`, `encodedBodySize` et
`decodedBodySize` **à zéro** — sauf si la réponse porte l'en-tête
`Timing-Allow-Origin`. Vérifié dans le dépôt : **la route média ne l'envoie
pas** (`story_media.py`, `_PRIVATE_MEDIA_HEADERS` ne porte que `Cache-Control`
et `X-Content-Type-Options`).

⛔ **Un zéro de taille ne doit donc PAS se lire « aucun transfert ».** Il se lit
« **donnée masquée par la politique inter-origines** ». Le relevé le dit
explicitement, et n'affiche jamais `0 octet` pour une ressource réellement
téléchargée.

**Pour rendre les tailles visibles**, il faudrait ajouter `Timing-Allow-Origin`
restreint à l'origine web sur la route média. C'est **une décision à part**,
qui n'est pas prise ici.

### ⚠️ Pourquoi le relevé ignore les URL `blob:`

L'application affiche les photos depuis des `blob:` créés en mémoire. Une
entrée de performance pour une `blob:` mesure la **lecture locale du Blob**,
pas le téléchargement authentifié qui l'a produit — elle est quasi nulle et
n'apprend rien. Le relevé ne retient que les requêtes vers
`/api/v1/story-media/`.

## Mode d'emploi

1. Ouvrir **`https://preview.yunicity.city`**, se connecter normalement, et
   aller jusqu'à la publication « Test multi-photo à supprimer ».
2. Ouvrir la console du navigateur et **coller le script ci-dessous**.
3. Faire les trois gestes, dans cet ordre, en laissant chaque photo s'afficher :
   **a.** premier affichage de la publication ; **b.** passage à la photo
   suivante ; **c.** retour à la photo précédente.
4. Taper `releve.resultat()` et copier le tableau.

```js
// Relevé MEDIA-MULTI-PHOTO-01 — lecture seule, aucun jeton lu ni affiché.
const releve = (() => {
  const entrees = [];
  const estMedia = (nom) => nom.includes("/api/v1/story-media/");

  const consigner = (e) => {
    if (!estMedia(e.name)) return; // ⛔ jamais les blob:
    // Une entrée d'une autre origine sans `Timing-Allow-Origin` rend des
    // tailles à zéro ET une chronologie plate. On le DÉTECTE au lieu de
    // présenter ces zéros comme des mesures.
    const opaque =
      e.transferSize === 0 && e.encodedBodySize === 0 && e.responseStart === 0;
    entrees.push({
      rang: entrees.length + 1,
      fichier: e.name.split("/").pop().split("?")[0],
      variante: new URL(e.name, location.href).searchParams.get("variant") ?? "(originale)",
      duree_ms: Math.round(e.duration),
      octets: opaque ? "indisponible (inter-origines)" : e.transferSize,
      corps_octets: opaque ? "indisponible (inter-origines)" : e.encodedBodySize,
      attente_ms: opaque ? "indisponible" : Math.round(e.responseStart - e.requestStart),
    });
  };

  performance.getEntriesByType("resource").forEach(consigner);
  const observateur = new PerformanceObserver((liste) => liste.getEntries().forEach(consigner));
  observateur.observe({ type: "resource", buffered: true });

  return {
    resultat() {
      console.table(entrees);
      const opaques = entrees.filter((l) => typeof l.octets === "string").length;
      console.log(
        `${entrees.length} requête(s) média — ${opaques} sans taille lisible ` +
          `(masquée par la politique inter-origines, ce n'est PAS « zéro octet »).`,
      );
      return entrees;
    },
    reinitialiser() {
      entrees.length = 0;
      performance.clearResourceTimings();
    },
  };
})();
console.log("Relevé armé. Faire les trois gestes, puis : releve.resultat()");
```

## Tableau à remplir

| Geste | Requêtes média | Variante | Durée observée | Taille |
|---|---|---|---|---|
| **a.** Premier affichage | | | | |
| **b.** Photo suivante | | | | |
| **c.** Retour arrière | | | | |

### Ce qu'on cherche à observer

| Attendu | Pourquoi |
|---|---|
| **a.** une seule requête, variante `card` | priorité au média courant ; la voisine ne part qu'après l'affichage |
| **b.** une requête `card` pour la nouvelle photo | résolution à mesure, pas de préchargement des dix |
| **c.** ⚠️ **aucune requête** | le Blob est conservé dans la session autorisée — c'est le seul geste qui prouve la réutilisation, puisque `no-store` interdit au navigateur de cacher la réponse |

⛔ **Ce relevé mesure l'état D'AVANT la correction** tant que le déploiement
n'est pas autorisé. La comparaison « après » demandera un nouveau déploiement,
et devra être refaite **sur la même publication** pour valoir quelque chose.
