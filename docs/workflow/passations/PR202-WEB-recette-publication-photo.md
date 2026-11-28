# Passation — Recette fonctionnelle de la publication photo

> **Ticket CLOS le 2026-10-22**, sur le périmètre fonctionnel effectivement
> testé, **avec trois réserves ouvertes** (§6). Index :
> [`../TICKETS-INDEX.md`](../TICKETS-INDEX.md)
>
> Ouvert le 2026-10-20. Ticket précédent :
> [`PR202-WEB-etat-des-lieux.md`](PR202-WEB-etat-des-lieux.md)
>
> **Traces durables** — ce sont elles qui font foi, pas cette passation :
> [`../../qa/PR202-WEB-bilan-consolide.md`](../../qa/PR202-WEB-bilan-consolide.md)
> (§2 E6, §4.1, §5.1, §7) et
> [`../../qa/PR202-WEB-recette-manuelle.md`](../../qa/PR202-WEB-recette-manuelle.md)
> (bloc C, tableau de résultats).

---

## 1. Objectif, et ce qu'il est devenu

Faire passer la publication photo de **I** (implémenté, validation incomplète) à
l'état vérifié sur Preview, aux formats concernés — sans rien réimplémenter.

**Atteint**, sur le périmètre testé, mais **en Vd et non en V** : voir §3.

---

## 2. Preuves acquises — source E6

| | |
|---|---|
| Qui | **Kyria**, exécution manuelle |
| Quand | **20–22/10/2026** |
| Où | **Preview**, `https://preview.yunicity.city` |
| SHA | `bf008a87` — **lu le 20/10, non relu le 22/10** (voir §5) |
| Contextes | **Safari sur iPhone réel**, **desktop**, **medium** |
| Nature | validation manuelle **appuyée par des captures** (voir ci-dessous) — **ni relevé réseau, ni mesure automatisée** |
| Où est la preuve | **captures détenues par Kyria, non versionnées dans le dépôt** — comme les identifiants du compte pilote |

### Validé aux trois contextes — et preuve disponible pour chacun

| # | Comportement | Preuve |
|---|---|---|
| 1 | **Ajout** d'une photo au composer et **aperçu** avant publication | **capture** de l'aperçu |
| 2 | **Remplacement** de la photo depuis l'aperçu, **texte saisi conservé** | **captures** du remplacement |
| 3 | **Règle du texte obligatoire expliquée**, et **retour du bouton Publier après saisie** | **capture** du message |
| 4 | **Publication effective**, photo de remplacement **entière et sans déformation** | **capture** de la publication |
| 5 | **Nom de l'auteur affiché** sur la publication | **capture** de la publication, où le nom figure sur la carte |
| 6 | **Persistance** de la publication et de sa photo après rechargement | **confirmation manuelle** de Kyria |

Tableau de référence : **§2.4 du bilan**.

### Validé sur un seul contexte

7. **Retrait** de la photo attachée, **texte conservé** — **Safari iPhone
   seulement**, sur **confirmation manuelle**. Desktop et medium non joués.

Ce comportement n'était couvert par aucun scénario : le scénario **C-9** a été
écrit après coup pour le rendre reproductible, et porté comme tel dans la
checklist.

### Scénarios joués

**5 sur 43** : C-1 ⚠️ partiel, C-3 ✅, C-4 ✅, C-8 ⚠️ partiel, C-9 ✅.

---

## 3. Décision CTO — pourquoi Vd et non V

Le §8 de la version précédente de cette passation annonçait un passage de **I**
à **V**. **C'est le code Vd qui a été appliqué.**

Le §3 du bilan réserve **V** à une validation **mesurée**. E6 est une validation
manuelle de Kyria, **appuyée par des captures d'écran** — de l'aperçu, de la
publication, du message de texte obligatoire, du remplacement — mais **sans
relevé réseau ni mesure automatisée**.

Les captures établissent l'état de l'écran à l'instant de la prise. Elles ne
donnent pas la reproductibilité. La classer **V** reviendrait à promouvoir une
observation au rang de mesure, et à perdre la distinction que le référentiel de
preuve existe précisément pour tenir. **Vd n'est donc pas un doute sur la
qualité de la preuve** : c'est la convention du §3 appliquée telle quelle.

**Conséquence** : seule une suite navigateur exécutée **contre Preview**
convertirait ces lignes de **Vd** vers **V**. C'est la dette « suite Playwright
non exécutée par la CI » du §5 du bilan qui s'y oppose — elle reste la cause
structurelle du besoin de recette manuelle.

**Décompte mesuré au 2026-10-22**, après intégration de E6 : 65 lignes dans la
matrice §4 — V 5 · **Vd 10** · I 46 · O 2 · D 1 · N 1.

> Ce décompte est **daté**, et il n'est pas mis à jour ici : il dit ce que la
> recette photo a produit, pas l'état courant du bilan. La recette **B-1** du
> 23/10 a depuis reclassé `a6ce6084` de **I** vers **Vd** — décompte courant au
> **§7 du bilan**, qui fait foi.

---

## 4. Ce qui n'a pas été observé — aucune déduction

À ne pas lire comme réussi :

- **La destination** d'une publication — quartier ou tribu. Seul le **nom** de
  l'auteur a été confirmé. La ligne `a6ce6084` reste donc en **I**.
- **C-2 comme scénario de bout en bout** : publier une photo portrait au format
  mobile et voir la carte s'adapter à sa hauteur. **Les deux orientations ont
  bien servi** — paysage à l'ajout de C-1, vertical sur les captures de
  remplacement, et c'est une image verticale qui a été publiée et vue entière.
  Ce qui n'est pas établi est le croisement **systématique** des deux
  orientations **aux trois formats**, pas l'absence de test du vertical.
- **Le média refusé** (C-5), l'**annulation de rédaction** (C-6), la **carte
  événement pleine largeur** (C-7) — hors du périmètre borné du ticket.
- **Le retrait de la photo sur desktop et medium.**
- **Le comportement du menu « … » sur desktop et medium** — voir §6.3.

---

## 5. Inconnues

1. **Le SHA déployé le 22/10.** Preview a été lu sur `bf008a87` le 20/10, et les
   onze correctifs du composer photo vérifiés **ancêtres** de ce SHA. Aucun push
   ni déploiement n'a eu lieu pendant la campagne. Mais le SHA **n'a pas été
   relu** le 22/10 : l'outillage Railway n'était pas disponible. E6 est rattaché
   à `bf008a87` **par continuité, non par relecture**. → **Relire le SHA déployé
   en ouverture du ticket suivant.**
2. **Les libellés exacts des publications de test** restées sur Preview. La
   convention prévoyait `Recette C-…` ; rien ne garantit qu'elle ait été suivie.
3. **La portée du défaut du menu « … »** hors Safari iPhone.
4. **Le périmètre des ajustements `/feed/new`** — non énoncé à ce jour.

---

## 6. Réserves ouvertes — trois sujets, consignés et non traités

Détail au **§5.1 du bilan**. Aucun n'a de cause établie ; **aucun correctif ne
doit être écrit avant qualification** — c'était la règle du ticket, elle
survit à sa clôture.

### 6.1 Bandes gris/blanc aux extrémités des photos — trois formats

Identifiant **proposé** : `MEDIA-05-PHOTO-LETTERBOX`. Ajustement visuel demandé
par Kyria.

**Ce n'est pas un échec de scénario** : le comportement attendu — photo affichée
en entier, jamais recadrée — est satisfait, et c'est lui qui passe en **Vd**.

> **Précision du 23/10/2026.** Ce document rattachait un « léger décalage de
> mise en page avant le chargement de l'image » à la dette des dimensions
> intrinsèques. **Kyria ne reproduit aucun décalage sur Safari iPhone**, et le
> phénomène vu au navigateur de bureau réduit est **distinct**. Le rattachement
> est retiré — la dette reste ouverte, son symptôme n'est plus établi sur
> appareil réel. Voir **§5.13 du bilan**.

**Hypothèse à vérifier, non mesurée** : les bandes seraient la contrepartie
géométrique du cadre à ratio fixe qui garantit la photo entière. Si elle se
confirme, le sujet est un **arbitrage produit** — « jamais rognée » contre « pas
de bande », non simultanément tenables dans un cadre à ratio fixe — et non un
correctif de rendu.

### 6.2 `/feed/new` — ajustements demandés, périmètre à préciser

Identifiant **proposé** : `FEED-NEW-UX-01`. **Le périmètre n'est pas défini** :
ni les écarts, ni le format, ni le comportement attendu.

**Première étape : recueillir l'énoncé de Kyria**, écart par écart. Rien ne peut
être estimé avant.

### 6.3 Menu « … » d'une publication du profil, inactif sur Safari iPhone

Identifiant **proposé** : `PROFILE-POST-MENU-01`. Classé **O** au §4.1 du bilan,
priorité **haute**.

Deux conséquences distinctes :

- **Utilisateur** : il ne peut pas supprimer sa publication **par ce chemin** sur
  cet appareil. La maîtrise de son propre contenu est en jeu.
- **Recette** : l'étape de nettoyage des scénarios C est **bloquée**, et **les
  publications de test sont restées sur Preview**.

**Le défaut établi s'arrête à ce chemin.** Les autres — carte du fil, détail
d'une publication, mêmes écrans sur desktop et medium — **n'ont pas été
vérifiés**. « La suppression est impossible » dépasserait la mesure ; « ce
chemin est mort » la respecte.

**Deux choses à faire, dans cet ordre** :

1. **Chercher un autre chemin de suppression qui fonctionne.** S'il en existe un,
   le nettoyage redevient possible sans attendre de correctif.
2. **Mesurer le comportement sur desktop et medium.** Un menu inactif sur un seul
   moteur et un menu inactif partout ne mènent pas au même diagnostic.

---

## 7. Erreurs de classement corrigées

Consignées, pas effacées — règle 15.

| Élément | Classement annoncé | Classement retenu | Preuve |
|---|---|---|---|
| Comportements validés du composer photo | **V** (§8 de la version précédente) | **Vd** | §3 du bilan : V exige une mesure ; E6 est une validation manuelle |
| Critère de sortie du ticket | « publications de test supprimées » | **non atteint**, levé en **réserve** | §6.3 — la suppression par ce chemin est inaccessible sur Safari iPhone |
| Nature de E6 | « **sans capture** » — première rédaction du 22/10 | **captures à l'appui** : aperçu, publication, message de texte obligatoire, remplacement | **rectification de Kyria, 22/10/2026**. La formulation était fausse : elle sous-déclarait la preuve réellement disponible. `Vd` reste le bon code, pour une autre raison — pas de relevé réseau ni de mesure automatisée |
| Orientation des photos employées | « **non déclarée** » — première rédaction du 22/10 | **paysage** en C-1, **vertical** sur les captures de remplacement et sur la publication | **rectification de Kyria, 22/10/2026**. La formulation effaçait une partie de ce qui avait été testé. Ce qui reste non couvert est le croisement systématique orientation × format, et C-2 de bout en bout |

Le critère de sortie du §7 précédent exigeait la suppression des publications de
test. **Il n'est pas atteint.** Le ticket est clos sur le périmètre fonctionnel
testé, ce qui ne transforme pas cette étape manquante en étape faite.

---

## 8. État Git

| | |
|---|---|
| Branche | `fix/mobile-publishing-p0` |
| Dernier commit | `8d2d4c9f` — `docs(workflow): respecter la validation de Kyria…` |
| Arbre de travail | **modifications non committées**, documentation seule |
| Fichiers modifiés | `docs/qa/PR202-WEB-bilan-consolide.md`, `docs/qa/PR202-WEB-recette-manuelle.md`, `docs/workflow/passations/PR202-WEB-recette-publication-photo.md`, `docs/workflow/TICKETS-INDEX.md` |

**Aucun commit, aucun push, aucun déploiement, aucune mutation Railway.** Aucun
correctif produit : le diff est entièrement documentaire. Le commit reste à la
main de Kyria.

Preview reste déployée depuis la branche `feat/c3-videos-refonte-final`, hors de
cette branche de travail — l'écart est normal et ne vaut pas défaut.

---

## 9. Ticket suivant — **B-1 seul**, activé

**Décision de Kyria, 2026-10-22** : le ticket suivant est **B-1 seul**, et non
les neuf scénarios du bloc B d'un coup. **C'est la nouvelle méthode — un
scénario par ticket.**

→ Passation du ticket :
[`PR202-WEB-recette-B1-fil-contenu.md`](PR202-WEB-recette-B1-fil-contenu.md)

### Pourquoi un scénario par ticket

Ce ticket-ci en est la démonstration. Six comportements bornés ont tenu, et il a
tout de même produit : un scénario manquant (C-9), un défaut (`O`), trois sujets
à ordonnancer, un critère de sortie non atteint et une erreur de classement à
corriger. Neuf scénarios d'un bloc auraient produit la même matière en neuf
exemplaires, et la passation aurait cessé d'être lisible.

Un scénario par ticket, c'est une passation qui reste courte, un critère de
sortie qui reste vérifiable, et une clôture qui dit sa portée sans effort.

### Pourquoi B-1 plutôt que la suite du bloc C

| Option | Ce qu'elle vaut | Ce qui la gêne |
|---|---|---|
| **B-1** *(retenu)* | **ne crée aucun contenu**, donc insensible au blocage de suppression ; porte la **destination**, seul point du périmètre photo resté non observé | aucun blocage connu |
| C-2 — publication portrait | fermerait le cas portrait de bout en bout | **publie du contenu**, donc retombe immédiatement sur `PROFILE-POST-MENU-01` |
| Traiter les réserves du §6 | déblocage du nettoyage | **ce n'est pas un ticket de recette** : deux des trois n'ont ni cause ni périmètre établis |

Le bloc C ne sera refermé **qu'après** `PROFILE-POST-MENU-01`, ou après qu'un
autre chemin de suppression ait été trouvé — sans quoi chaque scénario qui
publie laisse un résidu de plus sur Preview.

---

## 10. Reprise en session neuve

**Le ticket actif est désormais B-1**, et c'est **sa** passation qui porte la
reprise : [`PR202-WEB-recette-B1-fil-contenu.md`](PR202-WEB-recette-B1-fil-contenu.md).
Ce document-ci devient une trace de clôture — à relire pour le contexte, pas pour
savoir quoi faire.

1. Lire [`../TICKETS-INDEX.md`](../TICKETS-INDEX.md) — il désigne le ticket
   actif, et **fait foi** contre toute autre source.
2. Lire la passation de **B-1**, puis revenir ici si le contexte photo manque.
3. Énoncer le ticket actif et la prochaine action **avant** toute modification.
4. Rappels de méthode, qui ont tenu pendant ce ticket et valent pour le suivant :
   - **C'est Kyria qui exécute et rapporte.** L'agent présente le scénario,
     consigne le résultat, et **ne crée aucun contenu** sur Preview.
   - **Ne pas créer de compte** sur Preview.
   - La connexion a été validée manuellement le 20/10 et **n'est pas à rejouer
     systématiquement** ; si une session expire, se reconnecter sans en faire un
     scénario.
   - **Un défaut se qualifie avant de se corriger.**
   - **Une étape non observée se note non observée** — jamais conforme par
     déduction.
