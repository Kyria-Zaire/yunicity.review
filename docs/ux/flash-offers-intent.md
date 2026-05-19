# Offres flash — intention UX (TICKET-501)

## 1. Émotion recherchée

**Opportunité locale douce** — « il se passe quelque chose près de chez moi, et j’ai encore un peu de temps pour en profiter », sans stress ni culpabilité.

- Curiosité calme, pas panique
- Fierté d’être citoyen connecté à sa ville
- Respect du commerce (pas « promo cheap »)

## 2. Urgence utile vs FOMO toxique

| Urgence utile (Yunicity) | FOMO toxique (refusé) |
|--------------------------|------------------------|
| Information claire sur la fenêtre | Compte à rebours secondes |
| « Encore 2h » / « Aujourd’hui » | « DERNIÈRE CHANCE 🔥 » |
| Badge discret « Flash » | Bandeau rouge clignotant |
| Minorité d’offres flash dans le feed | Mur promotionnel |
| Sortie réelle encouragée | Rétention artificielle |

**Règle** : le timer **informe**, il ne **manipule** pas.

## 3. Intégration feed

- Même carte `OfferFeedCard`, enrichie si `is_flash` actif
- Pas de section « FLASH DEALS » séparée
- Ordre feed inchangé (city-first + chrono) — pas de boost algo promo
- Surface légère : badge + ligne temporelle en `textSecondary`

## 4. Intégration Passport

- Liste offres : même badge + timer discret
- Cohérence visuelle feed ↔ Passport
- CTA inchangé (« Utiliser ») — pas de pression supplémentaire

## 5. Style du timer

- Typo petite, couleur `#6B7280` ou accent soft `#EEF0FF` / `#2A2FFF` pour le badge uniquement
- Formats : « Encore 2h », « Se termine dans 2h 15m », « Disponible aujourd’hui », « Jusqu’à ce soir »
- Pas de secondes, pas de ticking, pas d’animation

## 6. Micro-copy (ton)

| Clé sémantique | Exemple |
|----------------|---------|
| Badge | Flash |
| Actif long | Disponible encore aujourd’hui |
| Bientôt fini | Se termine dans {duration} |
| Fin courte | Encore {duration} |
| Expiré (UI) | Offre flash terminée |

Sobre, humain, premium, local (Reims / votre ville).

## 7. Anti-patterns évités

- Groupon / casino / countdown géant
- Rouge agressif, gradients, glassmorphism
- Notifications spam (hors scope MVP)
- Popups, vibrations, streaks
- Classement promo algorithmique

## 8. Rôle des partenaires

- Toggle « Offre flash » à la création/édition (owner/admin)
- Choix date/heure de fin flash (`flash_ends_at`) avec aide contextuelle
- Responsabilité éditoriale : une flash = vraie opportunité locale limitée
- Modération inchangée (published → feed)

## 9. Philosophie « sortir vivre la ville »

Une offre flash doit inciter à **bouger** (café, culture, resto, boutique), pas à scroller indéfiniment. C’est un rappel qu’un lieu de Reims propose quelque chose de concret **maintenant** — pas une machine à coupons.

## 10. Pourquoi Yunicity n’est pas Groupon

| Groupon | Yunicity flash |
|---------|----------------|
| Volume promo massif | Minorité, crédible |
| Discount spectacle | Avantage Passport citoyen |
| Urgence artificielle | Fenêtre réelle chez un partenaire |
| Feed = pub | Feed = vie locale (posts + offres utiles) |
| Identité discount | Identité premium locale |

---

**Suite technique** : migration `partner_offers`, API + feed sync, `OfferFeedCard` / `OfferCard`, formulaires partenaire web/mobile, labels `@yunicity/utils`.
