# Passport — niveaux et réputation locale (TICKET-502)

## Vision

Le Passport Yunicity est une **identité citoyenne territoriale**, pas un profil gaming. Les niveaux expriment la **place** d’une personne dans sa ville (participation, confiance, contribution réelle).

Intention UX : [`docs/ux/passport-levels-intent.md`](../ux/passport-levels-intent.md).

## Niveaux MVP

| Code | Label FR | Visibilité | Attribution MVP |
|------|----------|------------|-----------------|
| `basic` | Citoyen·ne | Public | Activation Passport |
| `silver` | Silver | Public | Réputation ≥ 25 (parcours engagement) |
| `gold` | Gold | Public | Réputation ≥ 70 |
| `neo_arrivant` | Néo-arrivant | Public | Compte récent (< 14 j) à l’activation |
| `press_creator` | Créateur·rice local·e | Public | Admin / attribution manuelle (futur) |
| `business` | Business | Privé | Organisations (hors citoyen) |

> Le ticket mentionne « creator » : implémenté comme `press_creator` (catalogue existant).

## Réputation (MVP)

Score interne `reputation_score` sur `passports` — **non affiché comme XP** dans l’UI citoyen.

| Signal | Points |
|--------|--------|
| Redemption complétée | +10 (via compteur passport) |
| Tampon | +5 |
| Post citoyen publié | +5 |
| Compte vérifié | +5 |
| Passport actif ≥ 7 jours | +5 |

Recalcul à chaque évaluation (pas de cron lourd).

## Parcours d’engagement

```
basic ──(≥25)──► silver ──(≥70)──► gold
```

Les tiers spéciaux (`neo_arrivant`, `press_creator`, `business`) ne sont pas obtenus par grinding.  
`neo_arrivant` peut évoluer vers `silver` lorsque la réputation d’engagement le justifie.

## Notifications (TICKET-307)

Push sobres à la promotion : titre « Yunicity », corps court, `data.type = passport_level_up`.

Pas de spam, pas de confettis.

## Feed (optionnel)

Annonces système désactivées par défaut (`PASSPORT_LEVEL_FEED_ANNOUNCEMENTS=false`). Si activé : posts rares du type « … a atteint le niveau Silver ».

## Métriques légères

Logs structurés `passport_tier_promoted` (from, to, reputation_score) — agrégation via outil logs, pas d’analytics dédié en MVP.

## Exclusions strictes

Leaderboard global, XP grinding, streaks, daily rewards, lootboxes, achievements spam, ranking public agressif, économie virtuelle complexe.

## API

`GET /passport/me` enrichi : `reputation_score`, `progression` (niveau actuel, prochain palier, hint discret).

## Fichiers clés

- `backend/app/core/passport_level_rules.py`
- `backend/app/services/passport_level_service.py`
- `frontend/packages/utils/src/passport-level-labels.ts`
