# FEATURE-PILOT-REIMS-MEASURE

| Champ | Valeur |
|-------|--------|
| Feature | `FEATURE-PILOT-REIMS-MEASURE` |
| Phase BMAD | **MEASURE** (pas BUILD) |
| Founder | Kyria |
| CTO | ChatGPT |
| Exécution | Cursor |
| Durée pilote | 2 à 4 semaines |
| Population | 50–100 Rémois |
| Question north star | Est-ce que Yunicity change réellement la façon dont les Rémois découvrent leur ville ? |

---

## 1. Position CTO

La technologie Local Video est **DONE** (`FEATURE-CREATORS-V2`).  
Ce cycle ne construit **aucune feature produit** : il observe si les usages réels justifient un scale.

Doctrine : **Sécurité > intégrité données > architecture > UX > scalabilité > vitesse.**

Décision finale obligatoire : **GO SCALE** · **ITERATE** · **STOP**

---

## 2. Gate pré-pilote — TICKET M-00 ✅

### Objectif

Publier manuellement (ou via script ops) :

- 1 vidéo liée à un **lieu culturel**
- 1 vidéo liée à un **événement**

Valider propagation **100 %** :

| Surface | Statut (2026-06-13 dev) |
|---------|-------------------------|
| Feed | ✅ Rail « Vidéos près de chez vous » |
| Quartiers | ✅ Section « Vidéos du quartier » (`/neighborhoods/centre-ville`) |
| Places | ✅ Section « Vidéos de ce lieu » (`/places/cathedrale-notre-dame`) |
| Events | ✅ Section « Vidéos de l'événement » (`/events/d6050000-…-000001`) |
| `/videos` | ✅ Feed vertical + wow territorial |

### Références seed dev (dernière exécution)

| Type | ID vidéo | Lien territorial |
|------|----------|------------------|
| Lieu | `fadca877-c3b5-4d4c-8048-7de57b84b401` | Cathédrale (`d6030000-0000-4000-8000-000000000001`) |
| Événement | `678eaf7e-b666-49ff-881e-9f6c0150e149` | Afterwork découverte (`d6050000-0000-4000-8000-000000000001`) |

### Procédure ops

```bash
# 1. Seeds Reims (lieux + events partenaires)
docker compose exec backend python -m app.db.seeds

# 2. Publication M-00 (dev local ou recette)
cd backend && .venv/Scripts/python.exe scripts/pilot_m00_seed_videos.py
```

**Prérequis :** backend `:8000`, Redis flush si rate-limit auth (`docker compose exec redis redis-cli FLUSHDB`).

**Correctif débloquant M-00 :** API `GET /cultural-places/{slug}` — doublon `is_featured` dans `CulturalPlaceDetail` (corrigé session M-00).

---

## 3. Population pilote

| Profil | N cible |
|--------|---------|
| Étudiants | 20 |
| Jeunes actifs | 20 |
| Partenaires Yunicity | 10 |
| Associations | 5 |
| Créateurs locaux | 5 |
| Early adopters | 10–40 |

Recrutement : bouche-à-oreille Reims, partenaires signés, réseaux assos / campus.  
Comptes : inscription libre web ; pas de seed `--demo` obligatoire en prod pilote.

---

## 4. KPIs

### North star

**Nombre d'actions réelles déclenchées par une vidéo.**

Chaîne idéale :

```txt
Vidéo → Y aller → Lieu → Tampon → Offre Passport
```

### KPI 1 — Création

| Métrique | Question |
|----------|----------|
| Vidéos publiées | Les gens créent-ils ? |
| Auteurs uniques | |
| Délai avant 1ère vidéo | |
| % pilotes ayant posté | |

### KPI 2 — Consommation

| Métrique | Question |
|----------|----------|
| Sessions `/videos` | Les gens regardent-ils ? |
| Temps moyen session | |
| Vidéos vues à 90 % | |
| Swipes moyens / session | |
| Retour J+1 | |

### KPI 3 — Territorialité

| Métrique | Question |
|----------|----------|
| Vidéos par quartier | La ville prend-elle vie ? |
| Quartiers silencieux vs actifs | |
| Distance moyenne vidéos regardées | |

### KPI 4 — Action (priorité CTO)

| Métrique | Question |
|----------|----------|
| Clics CTA « Y aller » | Les vidéos poussent-elles à sortir ? |
| Clics lieux | |
| Clics événements | |
| Clics quartiers | |

### KPI 5 — Passport

| Métrique | Question |
|----------|----------|
| Tampons après parcours vidéo | Yunicity transforme-t-elle la découverte en économie locale ? |
| Redemptions offres post-visite | |

### KPI 6 — Santé produit

| Métrique | Question |
|----------|----------|
| Crashes client | Le produit tient-il ? |
| p95 chargement `/videos` | |
| Erreurs upload / publish | |
| Abandons upload | |

---

## 5. Seuils de décision

### Succès fort → GO SCALE

| Seuil | Valeur |
|-------|--------|
| Pilotes publiant une vidéo | ≥ 25 % |
| Pilotes ouvrant `/videos` | ≥ 40 % |
| Clics « Y aller » (sur viewers) | ≥ 15 % |
| Boucle Passport complète | ≥ 5 % |

### Succès moyen → ITERATE (wow territorial)

Consommation forte, actions locales faibles → renforcer C2-S4 / CTA / preuve sociale territoriale.

### Échec → STOP ou repenser UX

Faible consommation **et** faible création **et** faibles actions → pas de scale avant redesign.

---

## 6. Collecte des données (état actuel)

| Source | Disponibilité | Usage pilote |
|--------|---------------|--------------|
| DB `local_videos`, likes, comments | ✅ | KPI 1, 3 |
| `view_count` (si incrémenté) | Partiel | KPI 2 |
| Analytics produit (Posthog, etc.) | ❌ pas branché | **Observation manuelle + entretiens** semaines 1–2 |
| Logs backend erreurs upload | ✅ | KPI 6 |
| Verbatims sessions | Manuel | Rapports hebdo |

**Action MEASURE S1 :** définir grille d'observation facilitée (voir `beta-observation-script.md`) + feuille Google / Notion par participant.

Requêtes SQL de base (adapter env) :

```sql
-- Vidéos publiées pilote (fenêtre)
SELECT COUNT(*), COUNT(DISTINCT author_user_id)
FROM local_videos
WHERE status = 'published' AND city = 'Reims'
  AND published_at >= :pilot_start;

-- Répartition quartiers
SELECT n.slug, COUNT(v.id)
FROM local_videos v
JOIN neighborhoods n ON n.id = v.neighborhood_id
WHERE v.status = 'published' AND v.city = 'Reims'
GROUP BY n.slug ORDER BY COUNT DESC;
```

---

## 7. Livrables

| Livrable | Fréquence | Fichier |
|----------|-----------|---------|
| Rapport hebdo S1–S4 | Hebdo | `docs/measure/pilot-reims-reports/semaine-NN.md` |
| Rapport final BMAD | Fin pilote | `docs/measure/pilot-reims-rapport-final.md` |
| Décision CTO | Fin pilote | Section DECIDE du rapport final |

Template hebdo : `docs/measure/pilot-reims-weekly-report-template.md`

---

## 8. Roadmap post-pilote (si GO SCALE)

```txt
C3 Local Video
→ Carte vidéo vivante
→ 3 minutes créateurs vérifiés
→ Preuve sociale territoriale
→ Expo mobile
→ Déploiement progressif
```

---

## 9. Références

- Local Video PRD : `docs/prd/PRD-CREATORS-V2-local-video.md`
- Script observation UX : `docs/measure/beta-observation-script.md`
- Seed M-00 : `backend/scripts/pilot_m00_seed_videos.py`
- BMAD : `docs/bmad/BMAD.md`
