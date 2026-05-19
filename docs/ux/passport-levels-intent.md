# Niveaux Passport — intention UX (TICKET-502)

## 1. Émotion recherchée

**Fierté territoriale calme** — « je suis reconnu·e dans ma ville, sans spectacle ».

- Sentiment d’appartenance à Reims / son territoire
- Progression lente et méritée
- Identité premium, pas trophée de jeu

## 2. Réputation locale vs gamification toxique

| Réputation locale (Yunicity) | Gamification toxique (refusé) |
|------------------------------|-------------------------------|
| Participation réelle (sorties, offres, posts utiles) | Temps d’écran, scroll infini |
| Niveaux = identités citoyennes | Rangs gaming, XP partout |
| Progression lente | Level up instantané |
| Badge discret | « LEVEL UP 🔥🔥🔥 » |
| Notification sobre unique | Spam, confettis, casino |

**Règle** : le Passport **reflète la place** d’une personne dans sa ville — il ne **note pas** une addiction.

## 3. Signification sociale des niveaux

| Niveau | Identité (pas un rang) |
|--------|-------------------------|
| **Basic** | Citoyen·ne Yunicity — découverte du territoire |
| **Silver** | Engagement régulier — présence locale crédible |
| **Gold** | Ambassadeur·rice — contribution reconnue |
| **Néo-arrivant** | Bienvenue sur le territoire — parcours d’accueil |
| **Press / Creator** | Voix locale — création et médias territoriaux |
| **Business** | Passport organisation — hors parcours citoyen |

Les niveaux ne se comparent pas publiquement en leaderboard.

## 4. Rôle du Passport dans Yunicity

- **Identité** : carte citoyenne locale (QR, numéro, ville)
- **Confiance** : tiers pour accès offres partenaires
- **Mémoire** : tampons, redemptions — traces de présence réelle
- **Reconnaissance** : niveau = signal de contribution, pas de compétition

## 5. Philosophie « présence réelle »

La progression récompense :

- Utiliser des offres chez des partenaires (sortie physique)
- Collecter des tampons (visites)
- Publier dans le fil local (contribution, pas spam)
- Compte vérifié, ancienneté raisonnable

Elle ne récompense **pas** : streaks, clics vides, farming.

## 6. Exemples de progression saine

- **Semaine 1** : activation Basic, 1 tampon, lecture du fil
- **Mois 1** : 2–3 redemptions + 1 post → approche Silver (pas en 5 minutes)
- **Trimestre** : engagement régulier → Silver confirmé
- **Gold** : plusieurs mois de participation diverse — rare et prestigieux
- **Néo-arrivant** : attribution à l’arrivée, évolution vers Silver par la vie locale

## 7. Micro-copy notifications

| Événement | Ton |
|-----------|-----|
| Silver débloqué | « Vous avez atteint le niveau Silver. » |
| Gold débloqué | « Votre Passport évolue — niveau Gold. » |
| Néo-arrivant | « Bienvenue sur le territoire Reims. » |
| Creator | « Bienvenue parmi les créateurs locaux. » |

Titre push : **Yunicity** — corps court, premium, sans emoji agressif.

## 8. Anti-patterns évités

- Leaderboard global, XP visible partout, streaks
- Jauges rouges, animations casino, daily rewards
- Feed submergé de promotions de niveau
- Ranking public anxiogène
- Grinding artificiel (actions sans valeur locale)

## 9. Rareté et prestige

- **Gold** : minorité des citoyens actifs
- **Silver** : étape intermédiaire crédible, pas automatique au jour 1
- **Press / Creator / Business** : attribution contrôlée (admin / critères stricts)
- Badges : sobres, palette Yunicity (#2A2FFF, neutres), inspiration Wallet / Notion Verified

## 10. Pourquoi Yunicity n’est pas un système XP classique

| XP classique | Yunicity Passport |
|--------------|-----------------|
| Score omniprésent | Score interne discret (réputation) |
| Monter = jouer | Monter = participer à la ville |
| Compétition | Reconnaissance |
| Rétention dopamine | Confiance territoriale |

---

**Références implémentation** : `docs/product/passport-levels.md`, `passport_level_service.py`, `passport-level-labels.ts`.
