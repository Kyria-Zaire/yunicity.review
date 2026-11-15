# Réserves — livraison groupée Preview 7+8+9

Ne pas clore L7 / L8 / L9 au seul BUILD local. Rejouer sur Preview avec **SHA + env**.

## Levées en BUILD local (15/11 finitions)

| Ancienne réserve | État |
|------------------|------|
| F1 `panelTop≈48` vs 32 | **Levée** — mesuré **32** (Δ 0) |
| D2 retour post-login simulé | **Levée** (auth API + cookie refresh simulés) → lecteur `p1` + reload |

## Conservées

| Réserve | Détail |
|---------|--------|
| **Credentials réels non joués** | D2 local = auth **simulée** (`simule@example.test`, cookie mock). Aucun compte / secret réel. |
| Preview non livrée | Diffs L7+L8+L9 locaux ; tip Preview inchangé |
| Safari desktop (RC-D1) | Non rejoué en local |
| Appareil réel / lecteur d’écran | Hors sonde Chromium |
| CI Linux | Non exécutée pour ce BUILD |
| F1 `left: 811` | Flex ≈ 797,5 — revue visuelle Preview |
| Safari iOS / mobile réel | Préservation DOM medium/mobile OK en sonde ; Safari non prouvé ici |

## Critères Preview groupée

Cadrage L9 §7 + PRD §9.2 (R9-1…R9-7, checklist sécurité lot 9).
