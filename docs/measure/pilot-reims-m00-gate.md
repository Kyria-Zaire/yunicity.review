# TICKET M-00 — Propagation 100 % (gate pilote)

| Champ | Valeur |
|-------|--------|
| Statut | **VALIDÉ ✅** |
| Date | 2026-06-13 |
| Environnement | dev local (`:3000` / `:8000`) |

---

## Vidéos publiées

| Rôle | Titre | Video ID | Lien |
|------|-------|----------|------|
| Lieu | Pilote M-00 — Cathédrale | `fadca877-c3b5-4d4c-8048-7de57b84b401` | `cultural_place_id` = Cathédrale Notre-Dame |
| Événement | Pilote M-00 — Afterwork découverte | `678eaf7e-b666-49ff-881e-9f6c0150e149` | `local_event_id` = Afterwork Belga Queen |

---

## Matrice propagation

| Surface | URL test | Section UI | Résultat |
|---------|----------|------------|----------|
| Feed | `/feed` | Vidéos près de chez vous | ✅ |
| Quartiers | `/neighborhoods/centre-ville` | Vidéos du quartier | ✅ |
| Places | `/places/cathedrale-notre-dame` | Vidéos de ce lieu | ✅ |
| Events | `/events/d6050000-0000-4000-8000-000000000001` | Vidéos de l'événement | ✅ |
| Videos | `/videos` | Feed vertical + CTA territorial | ✅ |

---

## Prérequis exécution

1. `docker compose exec backend python -m app.db.seeds` (lieux culturels + events partenaires)
2. `backend/scripts/pilot_m00_seed_videos.py`
3. Fix API cultural places (`CulturalPlaceDetail` — doublon `is_featured`)

---

## Réserve non bloquante

Doublons teaser (2× Cathédrale, 2× Afterwork) dus à exécutions multiples du script M-00 — nettoyage optionnel en DB avant recette pilote.

---

## Verdict

```txt
Propagation 100 % validée → PILOTE REIMS AUTORISÉ 🟢
```

Voir cadre complet : `docs/measure/FEATURE-PILOT-REIMS-MEASURE.md`
