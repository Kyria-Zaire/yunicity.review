# VIDEO-03B — Align ARQ retry backoff with documented policy

| Champ | Valeur |
|-------|--------|
| Type | Dette technique |
| Statut | **OPEN** |
| Parent | VIDEO-03A (merged PR #72) |
| Priorité | P2 — observabilité / ops, pas bloquant pilote |
| Liens | `docs/adr/ADR-VIDEO-03A-async-media-processing-worker.md`, `backend/workers/video_worker.py` |

---

## Problème

L’ADR et `LOCAL_VIDEO_PROCESSING_RETRY_BACKOFF_SECONDS = (30, 120, 300)` documentent un backoff **progressif par tentative**.

L’implémentation actuelle dans `WorkerSettings` :

```python
retry_delay = LOCAL_VIDEO_PROCESSING_RETRY_BACKOFF_SECONDS[0]  # 30 seulement
```

ARQ applique ensuite : `defer = (job_try - 1)² × retry_delay` (cap 86400 s).

Résultat réel approximatif : **30 s → 120 s → 270 s**, pas **30 → 120 → 300** explicites.

---

## Impact

- Retries légèrement plus rapides ou plus lents que la spec ops
- Monitoring / runbooks basés sur 30/120/300 peuvent être trompeurs
- Pas de risque sécurité ou perte de données

---

## Critères d’acceptation

- [ ] Backoff effectif aligné sur `(30, 120, 300)` ou ADR mis à jour pour refléter la formule ARQ
- [ ] Test unitaire ou doc inline du calcul defer par `job_try`
- [ ] Log `local_video_job_retry` avec `backoff_seconds` réel avant re-enqueue
- [ ] `video_worker_startup` loggue la politique effective

## Pistes d’implémentation

1. Hook ARQ custom `on_job_retry` / defer explicite par `job_try`
2. Ou documenter officiellement la formule `(try-1)² × 30` et retirer la tuple 120/300 du contrat ops

---

## Hors scope

- Changer `max_tries` (reste 3)
- Modifier Cloudflare / R2 / Railway infra
