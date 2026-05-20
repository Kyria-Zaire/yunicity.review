# Tribus — Revue modération (TICKET-A.5)

**Feature :** FEATURE-A · **Phase :** STABILIZE  
**Références :** PRD-A0, spec A.1, backend A.2

## Matrice permissions MVP

| Action | member | moderator | owner | staff |
|--------|:------:|:---------:|:-----:|:-----:|
| Lire mur | ✓ | ✓ | ✓ | ✓ |
| Publier / commenter / liker | ✓ | ✓ | ✓ | ✓ |
| Supprimer son post | ✓ | ✓ | ✓ | ✓ |
| Supprimer post autre | — | ✓ | ✓ | ✓ |
| Exclure membre | — | ✓ | ✓ | ✓ |
| Promouvoir / rétrograder mod | — | — | ✓ | ✓ |
| Archiver tribu | — | — | API staff (`/admin/tribes`) | ✓ |
| Créer tribu (pilote) | — | — | — | ✓ |

## Surfaces modération

| Surface | Capacités |
|---------|-----------|
| Web | Panel coordination (lien invite), retrait post, exclusion, rôles mod |
| Mobile | Appui long post / membre → Alert (A.5) |
| Admin | Archive tribu |

## Risques `private_invite`

- Visibilité réduite en liste → surveillance modération renforcée côté produit
- Invitations par lien **et** nominatives (`invited_user_id`) depuis A.5
- Pas de mode secret (volontairement absent)

## Cas d’abus possibles

| Cas | Mitigation MVP |
|-----|----------------|
| Spam mur tribu | Cooldown 60 s, signalement `reports` réutilisé |
| Harcèlement membre | Exclusion mod+, logs `tribe_moderation_logs` |
| Tribu trop grande | Plafond 150 membres |
| Multi-tribus | Max 5 actives / user |
| Rejoin abusif | Cooldown 7 jours |

## Recommandations bêta

1. Modération staff hebdomadaire sur tribus `private_invite`
2. Ne pas activer trending / discovery tribus
3. Former owners sur charte et taille humaine
4. Monitorer logs exclusion + archive

## Limites MVP acceptées

- Pas d’archive owner côté citoyen (staff uniquement)
- Noms membres : `user_id` court si pas de profil enrichi inbox
- Pas de DM tribu, channels, vocaux
