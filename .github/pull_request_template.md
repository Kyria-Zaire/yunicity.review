## Résumé

<!-- Quoi et pourquoi en 2–4 phrases -->

## Ticket lié

- [ ] `SPRINT-X / TICKET-XXX — …`

## Phase BMAD / PRD

| Champ | Valeur |
|-------|--------|
| Phase BMAD | BUILD / MEASURE / ANALYZE / DECIDE |
| Statut PRD | DISCOVER / DESIGN / BUILD / VERIFY / RELEASE |
| PRD | `docs/prd/PRD-XXX-….md` (si applicable) |

## Checklist produit

- [ ] Scope limité au ticket
- [ ] Critères d’acceptation PRD couverts
- [ ] Copy UI en français (si UI)
- [ ] États loading / empty / error / success (si UI)

## Checklist technique

- [ ] Plan + fichiers impactés documentés
- [ ] Pas de logique métier dans les routes HTTP
- [ ] Types / schemas cohérents
- [ ] `.env.example` mis à jour si nouvelles variables
- [ ] Pas de régression évidente

## Checklist sécurité

- [ ] Aucun secret, token ou credential dans le diff
- [ ] AuthZ sur nouveaux endpoints sensibles
- [ ] [security-checklist.md](../docs/ai/security-checklist.md) parcourée si zone rouge (auth, PII, paiements, webhooks, admin, prod)

## Tests

- [ ] Tests ajoutés ou mis à jour
- [ ] Commandes exécutées :

```text
# ex. pytest, npm test, lint-agent-rules
```

## Captures (si UI)

<!-- Screenshots ou N/A -->

## Risques

<!-- Dette volontaire, migrations, dépendances, perf -->

## Rollback

<!-- Comment annuler en recette/preprod/prod si deploy -->

## Verdict reviewer

- [ ] Approuver
- [ ] Demander changements
- [ ] Commenter seulement
