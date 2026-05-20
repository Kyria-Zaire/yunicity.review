# Tribus — Revue fatigue UX (TICKET-A.5)

## Objectif

Vérifier que Feature A reste **respirable** et non addictive.

## Navigation mobile

| Point | Évaluation |
|-------|------------|
| Onglet Tribus dédié | OK — pas mélangé au fil |
| Retour fil local | Lien contextuel présent (web rail) |
| Profondeur | Liste → détail → mur (2 niveaux) |

**Risque modéré :** 7 onglets tab bar — acceptable pilote Reims.

## Densité écrans

- Liste : cartes aérées, pas de leaderboard
- Détail : hero + mur + membres en scroll unique (pas d’onglets Discord)
- Mur : pagination « plus ancien », pas scroll infini agressif

## Fatigue cognitive

| Facteur | Mitigation |
|---------|------------|
| Notifications | Invitation + acceptation uniquement ; pas de « new post » push tribu |
| Compteurs | Membres discrets, pas de streak |
| Join / leave | Leave silencieux, pas de feed public |
| Invitations | Section sobre, ignorer sans drama |

## Séparation feed / tribu

- Fil local = `tribe_id IS NULL` (tests backend + contrat TS frontend)
- Badge « Espace tribu » contextuel, pas viral
- Aucun repost tribu → feed

## Risques Discord-like

| Pattern | Statut |
|---------|--------|
| Channels | ❌ absent |
| Threads infinis | ❌ absent |
| @everyone | ❌ absent |
| Vocaux / live | ❌ absent |
| Trending tribus | ❌ absent |

## Verdict

**UX respirable pour clôture Feature A** — surveiller tab bar et mur si adoption > 80 membres actifs / tribu.
