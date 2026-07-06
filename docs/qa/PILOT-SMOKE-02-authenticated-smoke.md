# PILOT-SMOKE-02 — Smoke authentifié (compte pilote)

| Champ | Valeur |
|-------|--------|
| Feature | FEATURE-BETA-FIXES-V1 |
| Ticket | PILOT-SMOKE-02 |
| Phase BMAD | VERIFY |
| Prérequis | PILOT-SMOKE-01 = 🟡 GO CONDITIONNEL |
| Durée estimée | ~30 minutes |
| Environnement | `https://yunicity.city` (prod) |

---

## Objectif

Certifier la **surface authentifiée** non couverte par PILOT-SMOKE-01 faute de session utilisateur.

Verdict cible : **GO PRODUCTION CERTIFIED**.

---

## Préconditions

- [ ] Compte pilote prod disponible (identifiants hors repo)
- [ ] Navigateur propre ou session dédiée pilote
- [ ] DevTools Console ouverte (filtrer 401 attendus vs erreurs réelles)
- [ ] PILOT-SMOKE-01 lu — surface publique déjà PASS

---

## Checklist

Cocher **PASS** / **FAIL** / **NOT EXECUTED** pour chaque ligne.

### Session

- [ ] Connexion
- [ ] Refresh navigateur (session conservée)
- [ ] Déconnexion
- [ ] Reconnexion

### Profil (PILOT-FIX-02)

- [ ] Upload avatar
- [ ] Upload bannière / couverture
- [ ] Refresh navigateur
- [ ] URLs `media.yunicity.city` (ou CDN prod configuré)
- [ ] Images persistantes après refresh

### Stories (PILOT-FIX-03 / 03.1 / CREATORS-UX-04)

- [ ] Création story image
- [ ] Création story vidéo (si applicable)
- [ ] Publication
- [ ] Visible dans **Stories**
- [ ] **Absente** du Fil local
- [ ] Rail **« Ma Story »** actif
- [ ] Clic ouvre la story
- [ ] Refresh OK

### Local Video

- [ ] Créer une vidéo
- [ ] Upload R2
- [ ] Worker / transcodage
- [ ] Miniature
- [ ] Lecture CDN
- [ ] Likes
- [ ] Commentaires

### Création contenu (régression rapide)

- [ ] Créer un post (fil local)
- [ ] Créer un événement
- [ ] Créer une offre partenaire *(si compte partenaire)*
- [ ] Créer une tribu *(si autorisé)*

### Settings (PILOT-UX-04)

- [ ] Textes Passport (« Programme Yunicity Passport »)
- [ ] Badge « Disponible prochainement »
- [ ] Icône horloge (pas alerte amber)
- [ ] Aucune alerte « compte non vérifié »

---

## Rapport

```text
PILOT-SMOKE-02

Surface authentifiée : PASS / FAIL / NOT EXECUTED

Verdict final :
  GO PRODUCTION CERTIFIED
  ou
  NO-GO (avec régressions listées)
```

### Régressions (si FAIL)

| # | Zone | Repro | Sévérité |
|---|------|-------|----------|
| | | | |

---

## Références

- [PILOT-SMOKE-01](PILOT-SMOKE-01-production-validation.md)
- `docs/ops/SEED-PROD-cover-assets.md`
- `docs/architecture/MAPS-TECH-01-advanced-markers.md`
