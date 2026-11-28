# L9 — Justification D2 : mention « §3-2 » vs PRD

## Question

Le cadrage Desktop C (`CADRAGE-DESKTOP-C-ET-PLAN-IMPLEMENTATION.md`) dit encore, pour le
lot 9 / 401 : « comportement 401 *(§3-2)* » et « décision §3-2 **avant** le lot 9 ».
Faut-il rouvrir le débat aperçu public vs login, ou appliquer le PRD D2 ?

## Hiérarchie documentaire (projet)

| Rang | Document | Rôle |
|------|----------|------|
| 1 | `docs/prd/PRD-VIDEO-REFONTE-01-affichage-video.md` | Contrat produit validé (Lot 0) — gates, D1–D6, Story 6, §7 zone rouge |
| 2 | Cadrage Desktop C + plan lots | Proposition / plan d’implémentation **antérieur** au gel PRD |
| 3 | Maquettes / canevas | Référence visuelle C4 / C7 (pas auth) |

Règle appliquée : **quand le PRD a tranché une décision numérotée (ici D2), le wording
historique du cadrage ne la rouvre pas.** Le cadrage §3 liste les questions *avant*
code ; le même fichier §3 est annoté « TRANCHÉS le 13/11 » avec renvoi fiche §20.1 / PRD
§5.3–§5.6.

## Ce que dit chaque source

| Source | Texte | Statut |
|--------|-------|--------|
| Cadrage §1.5 tableau 401 | « *(§3-2)* comportement existant à confirmer » | **Placeholder** laissé après gel PRD — pas une décision contraire |
| Cadrage §2 lot 9 | « comportement 401 *(§3-2)* » | Même renvoi historique |
| Cadrage §2.1 risques | « décision §3-2 avant le lot 9 » | Calendrier d’origine (avant Lot 0) |
| Cadrage §3 point 2 | Question aperçu public / session — **TRANCHÉE** | Historique conservé |
| PRD Story 6 | Sans session → connexion puis **retour sur la vidéo** (D2) ; next interne | **Fait foi** |
| PRD §4 Hors scope | « Aperçu public … (**D2** : **refusé**) » | **Fait foi** |
| PRD §7 | Zone rouge auth ; `/login` existant ; `resolveAuthReturnPath` REC-01 | **Fait foi** |
| PRD §6.3 / §9.2 | Lot 9 = C4, C7 **et D2** | **Fait foi** |

## Conclusion (pas de contradiction bloquante)

Il n’y a **pas** deux décisions opposées en vigueur. Le cadrage pointe vers une décision
« §3-2 » qui a été **prise dans le PRD sous le nom D2** (aperçu public refusé, login +
`next` + retour lecteur). L’ancienne mention « §3-2 » désigne donc **la même décision**,
rédigée avant numérotation PRD ; elle n’est pas « périmée » au sens d’erreur, mais
**remplacée dans le langage opérationnel** par **D2 / PRD §7**.

L9 **implémente D2 PRD** : `ProtectedRoute` + `buildLoginUrlWithNext` /
`resolveAuthReturnPath` ; session expirée mid-fetch → `SessionExpiredPanel` avec
`returnPath=/videos?video=<id>`. **Aucun aperçu public.**

## Si une contradiction apparaissait

Seule une **nouvelle** décision CTO explicite (réouverture zone rouge auth / API publique)
pourrait contredire le PRD. Ce n’est pas le cas au GO L9.
