# PR202-WEB — Checklist de recette manuelle

> Adossée à [`PR202-WEB-bilan-consolide.md`](PR202-WEB-bilan-consolide.md).
> Chaque scénario converge vers une ligne de la matrice §4 : jouer le scénario
> fait passer la ligne de **I** (implémenté, validation incomplète) à **V**
> (corrigé et vérifié).
>
> **Environnement** : `https://preview.yunicity.city`, déploiement `bf008a87`.
> **Compte** : un compte de recette autorisé. **Ne pas créer de compte.**

---

## Comment utiliser cette checklist

**Les trois formats.** Beaucoup de correctifs ne concernent qu'une largeur.
Chaque scénario dit laquelle.

| Format | Largeur de fenêtre | Comment l'obtenir |
|--------|--------------------|-------------------|
| **mobile** | ~390 px | vrai téléphone, ou fenêtre réduite à 390 px de large |
| **medium** | ~820 px | fenêtre réduite à environ 820 px |
| **desktop** | ≥ 1280 px | fenêtre plein écran sur un écran large |

Pour changer de largeur sans outil de développement : réduisez la fenêtre du
navigateur à la main. Sur Mac, `Cmd` + `-` dézoome et élargit la mise en page —
**à éviter**, car le zoom et la largeur ne produisent pas les mêmes paliers.
Redimensionnez la fenêtre, ne zoomez pas.

**Ce qu'on note.** Pour chaque scénario : ✅ conforme, ❌ non conforme avec ce
que vous avez vu, ou ⏭️ non joué avec la raison. Un écran, même pris au
téléphone, vaut mieux qu'une description.

**Nettoyage.** Les scénarios qui publient quelque chose se terminent par une
étape de suppression. Elle fait partie du scénario.

---

## Ordre recommandé

1. **Bloc A — Session** : rien d'autre n'est testable sans elle.
2. **Bloc B — Fil et navigation** : le socle que tout le reste traverse.
3. **Bloc C — Publication photo** : le cœur du chantier, et le plus long.
4. **Bloc D — Stories**.
5. **Bloc E — Tribus**, dont le défaut connu à confirmer.
6. **Bloc F — Cartes et quartiers**.
7. **Bloc G — Passport**.
8. **Bloc H — Accessibilité et cibles**.
9. **Bloc I — Vidéo** : **en dernier**, et probablement non jouable (voir I-0).
10. **Bloc J — Vrai iPhone** : à grouper en une seule session sur appareil.

---

## Bloc A — Session

### A-1 · Connexion · mobile, medium, desktop

**Préconditions** : être déconnecté. Compte de recette autorisé.

1. Ouvrez `https://preview.yunicity.city/login`.
2. Saisissez l'adresse et le mot de passe du compte de recette.
3. Validez.

**Attendu** : vous arrivez sur le fil. Votre avatar ou votre nom apparaît.
Aucun message d'erreur.

> Couvre §4.13. E4 l'a déclaré conforme le 20/10/2026 ; ce scénario le confirme
> par un passage explicite, format par format.

### A-2 · Session conservée après rechargement · un seul format suffit

**Préconditions** : A-1 réussi.

1. Depuis le fil, rechargez la page (`F5`, ou tirez vers le bas sur mobile).

**Attendu** : vous êtes **toujours connecté**. Le fil se réaffiche avec du
contenu. Vous n'êtes pas renvoyé vers la page de connexion.

### A-3 · Déconnexion puis reconnexion · un seul format

1. Déconnectez-vous depuis le menu de votre compte.
2. **Attendu** : retour sur une page publique, plus d'avatar.
3. Reconnectez-vous.
4. **Attendu** : retour au fil, contenu affiché.

> Vérifie au passage la purge des médias autorisés au changement de session
> (§4.2) : aucune image d'un autre compte ne doit subsister.

---

## Bloc B — Fil et navigation

### B-1 · Le fil affiche du contenu · mobile, medium, desktop

**Préconditions** : connecté.

1. Ouvrez le fil.
2. Faites défiler jusqu'en bas de la première page de contenu.

**Attendu** : des publications s'affichent, avec pour chacune **le nom de son
auteur** et **sa destination** (quartier ou tribu). Aucune carte vide, aucun
cadre gris persistant.

### B-2 · Titre de page sous 1024 px · medium et mobile

1. Réduisez la fenêtre à environ 820 px, puis à 390 px.
2. Regardez le haut de la page du fil, puis celle des vidéos.

**Attendu** : un titre de page est visible dans les deux cas. La page ne
commence pas directement par du contenu sans intitulé.

### B-3 · Modules de contexte · les trois formats, dans cet ordre

> C'est le correctif le plus spécifique du chantier : ces modules n'étaient
> rendus à **aucune** largeur.

1. En **mobile** (390 px), parcourez le fil.
2. **Attendu** : des encarts de contexte apparaissent entre les publications —
   suggestions de tribus, activité du moment.
3. Passez en **medium** (820 px), rechargez.
4. **Attendu** : ces encarts sont **toujours présents**.
5. Passez en **desktop** (≥ 1280 px), rechargez.
6. **Attendu** : ces encarts **disparaissent du flux** — c'est volontaire, le
   rail latéral prend le relais. Aucun espace vide ne doit rester à leur place.

### B-4 · Rail droit du fil · desktop

**Attendu** : le rail commence par le **Passport**. L'agenda n'y apparaît
**qu'une seule fois** — pas de doublon.

### B-5 · Accès Explorer depuis le rail medium · medium

1. Fenêtre à environ 820 px, sur le fil.
2. Cherchez l'accès **« Explorer »** dans le rail latéral.
3. Cliquez.

**Attendu** : l'accès existe, est libellé « Explorer », et ouvre la surface de
découverte.

### B-6 · Changement de largeur pendant que le menu est ouvert · medium → desktop

1. En medium, ouvrez le menu de navigation.
2. Sans le fermer, **élargissez la fenêtre** jusqu'au format desktop.

**Attendu** : le menu se ferme proprement, et le focus clavier revient sur un
contrôle **visible**. Appuyez sur `Tab` : le cadre de focus doit apparaître sur
un élément à l'écran, jamais dans le vide.

### B-7 · Barre de navigation haute · desktop

1. Élargissez progressivement depuis 1024 px.

**Attendu** : la barre haute apparaît à partir du palier desktop et occupe sa
largeur propre, sans déborder ni se superposer au contenu.

### B-8 · Profil puis retour au fil · mobile, medium, desktop

1. Depuis le fil, ouvrez votre profil.
2. **Attendu** : votre page de profil s'affiche, avatar et bannière compris.
3. Revenez au fil, par le bouton retour du navigateur **puis** par la
   navigation de l'application.

**Attendu** : les deux chemins ramènent au fil, avec le contenu affiché.

> Couvre §4.2 (avatars et bannières) et §4.9. E4 l'a déclaré conforme ;
> ce scénario ajoute le double chemin de retour.

### B-9 · Superposition d'une fenêtre modale et barre du bas · mobile

1. Ouvrez une fenêtre modale quelconque (création, filtre, visionneuse).

**Attendu** : la modale passe **au-dessus** de la barre de navigation du bas.
Aucun bouton de la barre ne reste cliquable derrière la modale.

---

## Bloc C — Publication photo

> Ces scénarios **créent du contenu**. Chacun se termine par sa suppression.

### C-1 · Publier une photo · mobile

**Préconditions** : connecté. Une photo **paysage** dans la galerie du
téléphone ou sur le poste.

1. Ouvrez le menu de création, choisissez la publication.
2. Écrivez un texte court, par exemple `Recette C-1`.
3. Joignez la photo paysage.
4. **Avant de publier**, regardez l'aperçu.
5. **Attendu** : la photo est visible **en entier** dans l'aperçu — aucun bord
   coupé, le sujet n'est pas rogné.
6. Publiez.
7. **Attendu** : la publication apparaît dans le fil, avec **votre nom**, sa
   **destination**, et la photo **entière**.
8. **Nettoyage** : supprimez la publication.

### C-2 · Publier une photo **portrait** · mobile

Identique à C-1 avec une photo **portrait**.

**Attendu** : la photo est affichée en entier, sans recadrage, et la carte
s'adapte à sa hauteur. Pas de bande noire ni d'étirement.

**Nettoyage** : supprimez la publication.

### C-3 · Remplacer la photo attachée · mobile et medium

1. Ouvrez le composer, joignez une première photo.
2. Dans l'aperçu, cherchez l'option de **remplacement**.
3. Remplacez par une autre photo.

**Attendu** : le remplacement est possible **sans fermer le composer ni
recommencer**. L'aperçu montre la seconde photo. Le texte saisi est conservé.
4. **Nettoyage** : abandonnez sans publier.

### C-4 · Règle de texte expliquée · mobile ou desktop

1. Ouvrez le composer et tentez de publier **sans texte**, ou avec un texte
   manifestement trop court.

**Attendu** : un **message explicite** indique ce qui manque. Le bouton ne reste
pas simplement inactif sans explication.

### C-5 · Média refusé · desktop

1. Tentez de joindre un fichier **non image** — un PDF, par exemple.

**Attendu** : un message dit clairement que le fichier est refusé **et ce qui
est accepté**. Aucun état bloqué : vous pouvez joindre une image valide ensuite.

### C-6 · Annulation en cours de rédaction · mobile

1. Ouvrez le composer, écrivez du texte, joignez une photo.
2. Fermez le composer sans publier.
3. Rouvrez-le.

**Attendu** : comportement cohérent et non destructeur — soit un composer vide,
soit votre brouillon conservé. Dans les deux cas, **rien ne doit avoir été
publié**. Vérifiez le fil.

### C-7 · Carte événement pleine largeur · mobile

1. Trouvez une carte d'événement dans le fil.

**Attendu** : l'image s'étend jusqu'aux bords de la carte, **alignée** sur les
autres cartes. Pas de décalage de quelques pixels d'un côté.

### C-8 · Publication après rechargement · mobile

1. Publiez une photo (comme C-1).
2. **Rechargez la page.**

**Attendu** : la publication est **toujours là**, avec sa photo, son auteur et
sa destination.
3. **Nettoyage** : supprimez la publication.

---

## Bloc D — Stories

### D-1 · Publier une Story et voir le rail se rafraîchir · mobile

**Préconditions** : connecté, une photo disponible.

1. Notez l'état du rail de Stories en haut du fil.
2. Publiez une Story.
3. **Attendu, sans recharger** : le rail se **rafraîchit** et votre Story y
   apparaît.
4. Ouvrez votre Story.
5. **Attendu** : le média s'affiche — pas de cadre vide ni d'erreur de
   chargement.
6. **Nettoyage** : supprimez la Story.

### D-2 · Rail de Stories long · medium

1. Fenêtre à environ 820 px, sur le fil.
2. Faites défiler le rail de Stories horizontalement.

**Attendu** : le défilement est fluide, les vignettes gardent leur forme, et le
rail ne déborde pas de la zone de contenu.

---

## Bloc E — Tribus

### E-1 · Quitter une tribu publique · mobile

**Préconditions** : être membre d'une tribu publique.

1. Ouvrez la tribu.
2. Cherchez l'action pour la **quitter**.
3. Quittez.

**Attendu** : l'action **existe au format mobile** et aboutit. Vous n'êtes plus
membre.

### E-2 · Demande d'adhésion après rechargement — **défaut connu à confirmer** · mobile ou desktop

> Ce scénario doit **échouer**. Il confirme le défaut ouvert §4.8.

**Préconditions** : une tribu **privée** dont vous n'êtes pas membre.

1. Ouvrez la tribu, cliquez sur **« Demander à rejoindre »**.
2. **Attendu** : l'état passe à « en attente ».
3. **Rechargez la page.**
4. **Attendu conforme** : l'état « en attente » est **toujours affiché**.
5. **Défaut connu** : le bouton « Demander à rejoindre » **revient**, comme si
   aucune demande n'existait — alors que le serveur la connaît.

**Notez laquelle des deux situations vous observez.** Si le défaut est présent,
c'est la confirmation attendue, pas une surprise.

---

## Bloc F — Cartes et quartiers

### F-1 · Carte au format medium · medium

1. Fenêtre à environ 820 px, ouvrez la carte.

**Attendu** : la carte est **visible** et occupe sa zone. Pas de zone blanche,
pas de coquille cassée, pas de carte haute de quelques pixels.

### F-2 · Les douze secteurs officiels · desktop et medium

1. Ouvrez la carte, puis le portail des quartiers.
2. Comptez les secteurs proposés.

**Attendu** : **exactement douze**, et les mêmes aux deux endroits. Aucune
entité étrangère à la liste officielle.

### F-3 · Crédits d'images et illustration des Châtillons · desktop

1. Parcourez les fiches de quartier.
2. Sur une fiche illustrée par une image Wikimedia, cherchez le crédit.
3. **Attendu** : le crédit est présent, lisible, et compact — il n'écrase pas
   l'image.
4. Ouvrez la fiche **Châtillons**.
5. **Attendu** : l'illustration est la **Tour des Argonautes**.

### F-4 · Explorateur des secteurs · mobile, medium, desktop

1. Ouvrez l'explorateur des secteurs à chaque largeur.

**Attendu** : la mise en page s'adapte, les secteurs restent lisibles et
cliquables, rien n'est tronqué.

---

## Bloc G — Passport

### G-1 · Héros du Passport · desktop

1. Ouvrez le Passport.

**Attendu** : la carte principale a une surface **unie** premium. **Aucun
dégradé de couleur.** Le texte est lisible sur le fond.

### G-2 · Le CTA QR mène à un panneau visible · desktop et medium

1. Depuis le Passport, cliquez sur l'action du **QR code**.

**Attendu** : vous arrivez sur un panneau **visible à l'écran**. La page ne
saute pas vers une zone vide, et rien ne reste masqué.

### G-3 · Ancres du Passport · desktop

1. Cliquez successivement sur les liens internes du Passport.

**Attendu** : chaque lien amène à une section **effectivement affichée** à la
largeur courante.

---

## Bloc H — Accessibilité et cibles

### H-1 · Taille du bouton de création · mobile

1. Regardez le bouton de création dans la barre du bas.

**Attendu** : confortable au pouce, sans viser. Il doit faire au moins
44 × 44 px — en pratique, il ne doit pas paraître plus petit que les autres
icônes de la barre.

### H-2 · Liens d'en-tête public à 1366 px · desktop

> Vérifie le correctif `769c7c6e`, qui a porté la zone cliquable de ces deux
> liens à 44 px. §4.11.

1. **Déconnectez-vous.** Réglez la fenêtre à environ **1366 px** de large.
2. Sur la page d'accueil publique, visez les liens **« Découvrir Reims »** et
   **« Comment ça marche »**.

**Attendu** : la zone cliquable est confortable — vous atteignez le lien sans
viser précisément. Le survol doit réagir un peu au-dessus et un peu en dessous
du texte, signe que la zone dépasse la hauteur des lettres.

Dites si la cible vous paraît encore difficile à viser.

### H-3 · Navigation entièrement au clavier · desktop

1. Depuis le fil, n'utilisez que `Tab`, `Maj+Tab`, `Entrée` et `Échap`.
2. Parcourez l'en-tête, le fil, le rail.

**Attendu** : le cadre de focus est **toujours visible**, il ne disparaît jamais,
et l'ordre de parcours suit la lecture de l'écran.

---

## Bloc I — Vidéo

### I-0 · Préalable bloquant — à vérifier d'abord

1. Ouvrez la page des vidéos sur Preview.

**Si aucune vidéo n'apparaît** : les médias d'exemple ne sont pas présents sur
Preview (dette ouverte, §5). Les scénarios I-1 à I-4 ne sont alors **pas
jouables**, et doivent être notés ⏭️ avec cette raison. Ne créez pas de contenu
pour contourner.

### I-1 · Lecture d'une vidéo du fil · mobile et desktop

**Attendu** : la vidéo se lance, l'image n'est ni étirée ni pivotée, le son suit
le réglage du système.

### I-2 · Explication du classement territorial · mobile et desktop

**Attendu** : là où le fil vidéo est rendu, une mention explique **pourquoi**
ces vidéos apparaissent — proximité territoriale. Elle est lisible et ne masque
pas la vidéo.

### I-3 · Envoi d'une vidéo, progression et annulation · mobile

**Préconditions** : une vidéo de moins de 90 secondes.

1. Lancez l'envoi.
2. **Attendu** : une **progression** avance visiblement, sans reculer.
3. **À mi-parcours, annulez.**
4. **Attendu** : l'envoi s'arrête, le formulaire redevient utilisable,
   l'annulation **n'est pas présentée comme une panne**, et **rien n'est
   publié**. Vérifiez la page des vidéos.

### I-4 · Limite de durée · mobile

1. Tentez d'envoyer une vidéo **de plus de 90 secondes**.

**Attendu** : un message clair annonce la limite **avant** tout envoi long.

---

## Bloc J — Vrai iPhone / Safari

> **Ces vérifications exigent un véritable iPhone avec Safari.** Un simulateur
> ou le mode responsive d'un navigateur de bureau ne les couvre pas : le
> comportement de zoom au focus et la gestion des zones sûres sont propres au
> moteur et à l'appareil.

### J-1 · Pas de zoom au focus d'un champ · iPhone/Safari

1. Ouvrez `/login` sur l'iPhone.
2. Touchez le champ d'adresse e-mail.

**Attendu** : la page **ne zoome pas**. La mise en page reste stable.
3. Répétez sur le composer de publication et sur la recherche.

### J-2 · Zones sûres · iPhone/Safari

1. Parcourez le fil, ouvrez une modale, ouvrez le composer.

**Attendu** : rien n'est masqué par l'encoche ni par la barre de gestes du bas.
La barre de navigation reste atteignable.

### J-3 · Envoi d'une photo prise sur le moment · iPhone/Safari

1. Depuis le composer, prenez une photo avec l'appareil.

**Attendu** : la photo part, s'affiche **dans le bon sens** — une photo prise en
portrait ne doit pas apparaître pivotée — et en entier.
2. **Nettoyage** : supprimez la publication.

### J-4 · Rotation de l'appareil · iPhone/Safari

1. Sur le fil, passez en paysage puis revenez en portrait.

**Attendu** : la mise en page suit, rien n'est tronqué, la position de lecture
n'est pas perdue.

---

## Récapitulatif de couverture

| Bloc | Scénarios | Ligne du bilan couverte |
|------|-----------|-------------------------|
| A — Session | 3 | §4.13, §4.2 |
| B — Fil et navigation | 9 | §4.6, §4.9, §4.2 |
| C — Publication photo | 8 | §4.1, §4.2 |
| D — Stories | 2 | §4.3 |
| E — Tribus | 2 dont **1 défaut à confirmer** | §4.8 |
| F — Cartes et quartiers | 4 | §4.7 |
| G — Passport | 3 | §4.10 |
| H — Accessibilité | 3 | §4.11 |
| I — Vidéo | 4 + 1 préalable, **probablement non jouables** | §4.4 |
| J — Vrai iPhone | 4 | §4.11, §4.4 |
| **Total** | **42 scénarios** | |

Un seul scénario — **E-2** — est écrit pour **confirmer un défaut connu**. Le
voir échouer est le résultat attendu, et ne doit pas être traité comme une
découverte.

> **Reconciliation du 2026-10-20.** H-2 confirmait auparavant un défaut sur les
> liens d'en-tête. Vérification faite, ce défaut avait été corrigé dans le
> commit qui le relevait : le scénario vérifie désormais le correctif.
