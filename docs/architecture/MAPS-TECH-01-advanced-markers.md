# MAPS-TECH-01 — Migration AdvancedMarkerElement

**Ticket lié :** PILOT-FIX-05B · FEATURE-BETA-FIXES-V1  
**Statut :** Dette technique documentée (non migré)

## Contexte

`google-event-map.tsx` utilise `google.maps.Marker` avec des icônes `Symbol` (cercles, losanges, carrés).
Google affiche un avertissement de dépréciation recommandant `google.maps.marker.AdvancedMarkerElement`.

## Pourquoi pas migré dans PILOT-FIX-05B

| Risque | Détail |
|--------|--------|
| `mapId` obligatoire | Advanced Markers requiert un Map ID Cloud Console (style vectoriel) |
| Icônes Symbol | Non supportées telles quelles — refonte pin HTML/CSS |
| 5 familles de markers | Événements, lieux, quartiers, tribus, partenaires — régression visuelle probable |
| Scope ticket | Cleanup post-billing, pas refonte carte |

## Migration future (checklist)

1. Créer un Map ID prod dans Google Cloud Console (même projet que la clé actuelle).
2. Passer `mapId` dans `google.maps.Map` options.
3. Charger `importLibrary("marker")` après le loader existant.
4. Remplacer `google.maps.Marker` par `AdvancedMarkerElement` + contenu pin custom.
5. Smoke `/map` : sélection, z-index actif, filtres Quartiers / Lieux / Événements.

## Fichiers impactés

- `frontend/apps/web/components/map/google-event-map.tsx`
- `frontend/apps/web/hooks/use-google-maps.ts` (libraries / importLibrary)
