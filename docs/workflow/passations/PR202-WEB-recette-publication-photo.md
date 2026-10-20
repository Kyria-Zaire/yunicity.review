# Passation — Recette fonctionnelle de la publication photo

> **Ticket ACTIF** depuis le 2026-10-20. Index :
> [`../TICKETS-INDEX.md`](../TICKETS-INDEX.md)
>
> Ticket précédent clos :
> [`PR202-WEB-etat-des-lieux.md`](PR202-WEB-etat-des-lieux.md)

---

## 1. Objectif

Faire passer la publication photo de **I** (implémenté, validation incomplète) à
**V** (vérifié par mesure) sur Preview, aux formats concernés.

**Ce ticket ne réimplémente rien.** Les correctifs existent, sont déployés, et
leur preuve existe — sur un autre environnement. Ce ticket produit la preuve
manquante : celle du déploiement réel.

---

## 2. Périmètre borné

Six comportements, et rien d'autre.

| # | Comportement | Scénario | Format |
|---|--------------|----------|--------|
| 1 | **Ajout** d'une photo au composer | C-1, C-2 | mobile |
| 2 | **Remplacement** de la photo attachée depuis l'aperçu | C-3 | mobile, medium |
| 3 | **Règle de texte** expliquée au lieu d'un blocage muet | C-4 | mobile ou desktop |
| 4 | **Publication** effective, auteur et destination affichés | C-1, C-2 | mobile |
| 5 | **Photo affichée en entier**, jamais recadrée — paysage et portrait | C-1, C-2 | mobile |
| 6 | **Persistance après rechargement** | C-8 | mobile |

### Hors périmètre, explicitement

Médias refusés (C-5), annulation en cours de rédaction (C-6), carte événement
pleine largeur (C-7), Stories, vidéo, et tout format non listé ci-dessus. Ils
appartiennent à d'autres blocs de la checklist et à d'autres tickets.

---

## 3. Correctifs référencés — à vérifier, pas à refaire

| Correctif | Commit | Ligne du bilan |
|-----------|--------|----------------|
| Identité de l'auteur et destination rétablies sur la carte | `a6ce6084` | §4.1 |
| Règle de texte expliquée au lieu d'un blocage silencieux | `44922bc5` | §4.1 |
| Remplacement de la photo offert depuis l'aperçu | `a79533ea` | §4.1 |
| Photo affichée en entier ; une seule source décide du cadrage | `125ba4ff`, `7a990e66` | §4.1 |
| Cycle de vie de l'envoi d'image durci | `8f98c219` | §4.1 |
| Chargement des images via l'API authentifiée | `16348b35`, `c8656b9d` | §4.2 |
| Surfaces média unifiées, cadres adaptatifs, cartes mobiles compactées | `808673e0`, `8d661210`, `c6b08e3d` | §4.2 |

**Si un scénario échoue**, le défaut est à qualifier avant toute correction :
quel commit portait le comportement attendu, et qu'est-ce qui diffère entre
l'environnement de sa preuve et Preview. Corriger sans cette qualification
reviendrait à réimplémenter à l'aveugle.

---

## 4. Préconditions

- Un **compte de recette autorisé**. **Ne pas créer de compte sur Preview**, et
  ne rien publier à la place de Kyria.
- **La connexion n'est pas à rejouer systématiquement** : elle a été **validée
  manuellement par Kyria** le 20/10/2026 sur Preview, sur le parcours et le
  format déclarés. On démarre directement sur la publication photo. Si une
  session se révélait expirée en cours de recette, se reconnecter simplement,
  sans en faire un scénario.
- Une photo **paysage** et une photo **portrait** sur l'appareil de test.
- Preview en ligne sur `bf008a87` ou postérieur.

---

## 5. Données et nettoyage

Les scénarios 1, 4, 5 et 6 **publient du contenu réel sur Preview**. Chacun se
termine par la **suppression** de la publication créée — l'étape fait partie du
scénario, pas d'un rangement ultérieur.

Convention de texte : `Recette C-1`, `Recette C-2`, `Recette C-8`, pour
retrouver et supprimer sans ambiguïté.

---

## 6. Dette connexe, à ne pas confondre avec un défaut

**Dimensions intrinsèques des médias non servies par l'API** — dette ouverte,
deux identifiants pour un même sujet (`MEDIA-METADATA-01` et
`MEDIA-03-INTRINSIC-DIMENSIONS`), à fusionner en un ticket.

Conséquence pour la recette : un **léger décalage de mise en page avant le
chargement de l'image** est le symptôme de cette dette, pas un échec de
scénario. À noter, pas à traiter comme une régression.

---

## 7. Critère de sortie

Les six comportements du §2 observés conformes sur Preview, aux formats
indiqués, avec les publications de test supprimées. Les lignes correspondantes
du bilan passent alors de **I** à **V**, en citant la date et l'environnement.

Un seul échec suffit à maintenir la ligne concernée en **I**, avec le défaut
qualifié.

---

## 8. Prochaine action

**Jouer C-1 · Publier une photo paysage, au format mobile**, sur Preview, avec
le compte de recette autorisé — puis supprimer la publication.

C'est Kyria qui exécute et rapporte ; l'agent présente le scénario, consigne le
résultat, et **ne crée aucun contenu**. En cas de défaut : le consigner et
**établir sa cause avant** de proposer une correction.

État d'avancement des six comportements du §2 : **aucun joué à ce jour**.
