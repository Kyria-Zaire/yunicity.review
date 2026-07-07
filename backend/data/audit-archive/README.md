# Audit archive — snapshots pré-nettoyage

Archive **read-only** conservée comme trace d'audit et capacité de rollback logique
pour deux opérations de nettoyage de données de **test** exécutées sur l'environnement
**recette**. Extraits d'un stash git local le 2026-07-07 (byte-identiques aux originaux,
hash git vérifié) pour éviter une perte lors d'un `git stash drop`.

## Contenu

| Fichier | Script source | Date | Nature | Portée |
|---|---|---|---|---|
| `data-cleanup-01-dry-run-20260701T204953Z.json` | `scripts/data_cleanup_01_purge.py` | 2026-07-01 | dry-run (aucune suppression) | plan de purge |
| `data-cleanup-01-execute-20260701T205346Z.json` | `scripts/data_cleanup_01_purge.py` | 2026-07-01 | **hard DELETE appliqué** | 2 `local_videos` + 2 `local_video_uploads` + 4 `users` |
| `partner-public-cleanup-20260603T041938Z.json` | `scripts/cleanup_test_partner_public_surfaces.py` | 2026-06-03 | changement de flags **réversible** | 1 organisation |
| `partner-public-cleanup-20260603T042243Z.json` | `scripts/cleanup_test_partner_public_surfaces.py` | 2026-06-03 | changement de flags **réversible** | 1 organisation |

## Pourquoi conservés

- **Trace d'audit** : historique horodaté de ce qui a été retiré des surfaces recette.
- **Rollback logique** : le snapshot `execute` capture **toutes les colonnes** de chaque
  ligne supprimée (le `DELETE` est physique, pas un soft-delete) — les lignes sont donc
  ré-insérables manuellement si nécessaire. Les backups partenaires portent les valeurs
  d'origine (`partner_status=active`, `visibility=public`) et le script associé expose un
  mode `--restore <file>`.

## Aucune donnée sensible

- **Environnement recette uniquement** — bucket R2 `yunicity-media-recette`, URLs
  `media.recette.yunicity.city`. Aucune donnée de production.
- **Données de test uniquement** — vidéos `"INFRA-01 R2 smoke test"`, comptes pilote
  `pilot-m00-*@example.com`, organisation de test `admin-creator-org-reject`.
- **Aucune PII réelle** — tous les emails sont des placeholders `@example.com`. Aucun
  secret, token ni numéro de carte.

> Ne pas modifier ces fichiers : ce sont des snapshots figés. Toute restauration éventuelle
> passe par une revue humaine et les scripts d'origine dans `backend/scripts/`.
