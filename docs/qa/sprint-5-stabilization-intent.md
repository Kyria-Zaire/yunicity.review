# Sprint 5 — Stabilisation & cohérence produit (TICKET-506)

## 1. Cohérence émotionnelle globale

Yunicity doit transmettre une **présence locale calme** : confiance, découverte douce, mémoire territoriale. Chaque surface (fil, passport, événements, offres, notifications) partage le même ton : humain, territorial, premium — jamais startup bruyante ni gaming.

## 2. Transitions entre features

Les parcours doivent se **enchaîner naturellement** :

- Fil → détail événement → intérêt sauvegardé
- Scan / redemption → tampon passport → notification sobre (si méritée)
- Notification → deeplink → écran cible sans rupture de ton

Pas de changement de « personnalité » entre onglets.

## 3. Identité Yunicity

- Blanc dominant, accent **#2A2FFF** unique
- Pas de violet legacy, pas de gradients agressifs
- Typographie lisible, hiérarchie éditoriale (titres sobres, meta en gris)

## 4. Friction utilisateur

Réduire : chargements sans feedback, erreurs techniques exposées, CTA multiples concurrents, chemins morts après action réussie.

## 5. Fatigue cognitive

Limiter : badges superflus, compteurs viraux, densité scroll, notifications en rafale, sections passport empilées sans respiration.

## 6. Lisibilité produit

Chaque écran répond en 3 secondes : **où suis-je**, **qu’est-ce que je peux faire**, **qu’est-ce qui se passe ensuite**.

## 7. Cohérence mobile / web

Même micro-copy (`event-labels`, `stamp-labels`, `feed-labels`), mêmes états vides, même hiérarchie — adaptations layout (tabs vs sidebar) sans divergence de sens.

## 8. Rythme visuel

Espacement généreux, cartes aérées, listes pas surchargées. Le fil alterne contenus sans hurler « promo ».

## 9. Calme UX

Animations minimales, pas de pulse / shake / FOMO. Timers flash discrets. Notifications texte sobre.

## 10. Anti-patterns détectés (à éliminer en stabilisation)

| Anti-pattern | Règle |
|--------------|--------|
| Marketplace événements | Cartes éditoriales, pas compteurs places |
| Gaming passport | Souvenirs, pas XP / leaderboard |
| Feed saturé offres flash | Flash rares, badge discret |
| Notifications manipulatives | Pas de 🔥, « dernière chance », trending |
| Wording technique | Français citoyen, pas codes API |
| Dashboard passport | Sections aérées, chronologie claire |

---

**Livrables ticket** : audit → corrections ciblées → seed Reims → `regression-checklist.md` → `sprint-5-stabilization-report.md`.
