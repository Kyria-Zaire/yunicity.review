# Workflow officiel Yunicity

> Source de vérité : feature = **PRD → BMAD → BUILD → REVIEW → TEST → DEPLOY**  
> Compléments : `docs/bmad/BMAD.md`, `docs/prd/PRD-template.md`, `docs/ai/security-checklist.md`

---

## 1. Flow standard

```
Idea
  ↓
PRD
  ↓
Architecture
  ↓
BUILD
  ↓
Tests
  ↓
Security Review
  ↓
MEASURE
  ↓
ANALYZE
  ↓
DECIDE
  ↓
Merge
  ↓
Deploy Dev
  ↓
Recette
  ↓
Preprod
  ↓
Production
```

Chaque feature importante suit ce flux. Pas de saut sans justification écrite dans le PRD §13.

---

## 2. Phases officielles (PRD + delivery)

| Phase | Objectif | Outputs |
|-------|----------|---------|
| **DISCOVER** | Comprendre le problème | PRD, scope, user stories, risques |
| **DESIGN** | Concevoir la solution | Architecture, DB schema, endpoints, UX, sécurité |
| **BUILD** | Implémenter | Code, tests, migrations |
| **VERIFY** | Vérifier | QA, tests, review sécurité, review CTO |
| **RELEASE** | Déployer | Monitoring, logs, rollback prêt |

### Sous-cycle BMAD (VERIFY → RELEASE)

| Étape | Quand |
|-------|-------|
| **MEASURE** | Post-deploy recette / preprod / prod |
| **ANALYZE** | Données collectées |
| **DECIDE** | Prochaine action (scale, refactor, stop, etc.) |

**Règle CTO :** ne jamais scaler une mauvaise architecture.

---

## 3. Mapping PRD ↔ phases ↔ BMAD

| Statut PRD | Phase officielle | Cycle BMAD | Sections PRD |
|------------|------------------|------------|--------------|
| DISCOVER | DISCOVER | — | §1–3, §2 risques |
| DESIGN | DESIGN | — | §5 UX, §6 archi, §7 sécurité |
| BUILD | BUILD | BUILD | §4, §6 complet, §13 gates |
| VERIFY | VERIFY | Tests + review | §9, checklist sécurité |
| RELEASE | RELEASE | MEASURE → ANALYZE → DECIDE | §10 rollout, §13 métriques |

---

## 4. Règles de qualité — feature REFUSÉE si

- [ ] Pas de sécurité (authZ, validation, zones rouges non revues)
- [ ] Pas de tests sur chemins critiques
- [ ] Permissions floues
- [ ] Endpoints incohérents (contrats PRD §6)
- [ ] Architecture spaghetti
- [ ] Dette technique dangereuse non documentée
- [ ] Migrations dangereuses (sans backup / preprod dry-run)
- [ ] UX cassée (pas loading / empty / error / success)

---

## 5. Anti-spaghetti BMAD

### Symptômes

- Fichiers géants · routes énormes · logique mélangée
- Duplication · dépendances circulaires · UI surchargée

### Action

> **STOP BUILD → REFACTOR FIRST**

Puis reprendre BUILD avec incrément testable.

---

## 6. Sécurité BMAD

### Zones rouges

| Zone | Exigence |
|------|----------|
| Auth | Review + tests |
| Permissions | Matrice explicite PRD §6 |
| Paiements | Idempotence, montants serveur |
| Webhooks | Signature + replay protection |
| Uploads | MIME, taille, stockage |
| Admin / CRM | RBAC + audit |
| Géolocalisation | PostGIS, privacy |
| Données personnelles | RGPD, minimisation |
| Migrations DB | Preprod dry-run, rollback |
| Production | Jamais hack direct |

Toute modification critique nécessite : **review sécurité · tests · plan de rollback**.

Aucune IA ne modifie ces zones sans raisonnement explicite, tests et validation humaine.

---

## 7. Environnements

| Env | Rôle |
|-----|------|
| **DEV** | Expérimentation locale |
| **RECETTE** | Validation fonctionnelle |
| **PREPROD** | Simulation production |
| **PROD** | Stabilité maximale |

**Règle :** jamais de hack temporaire directement en prod.

Promotion : `dev → recette → preprod → prod` — voir `09-environments`.

---

## 8. Git workflow

| Branche | Usage |
|---------|--------|
| `main` | Production-ready |
| `develop` | Intégration |
| `feature/*` | Features |
| `fix/*` | Corrections |
| `hotfix/*` | Urgent prod (validation CTO) |

- **PR obligatoire** pour toute feature importante
- Review : `05-code-review` + sécurité si zone rouge

---

## 9. AI workflow (Cursor / Claude)

### Doit

1. Lire le **PRD**
2. Identifier les **risques**
3. **Planifier** (fichiers impactés)
4. Implémenter **petit**
5. **Tester**
6. **Review sécurité** si zone rouge
7. **Résumer** (changements, tests, risques restants)

### Ne doit jamais

- Improviser une architecture critique sans DESIGN documenté
- Modifier prod sans validation
- Supprimer des données sans confirmation explicite
- Contourner la sécurité
- Ignorer les tests critiques
- Committer sans demande utilisateur

---

## 10. Doctrine CTO — priorités

1. **Sécurité**
2. **Intégrité des données**
3. **Architecture propre**
4. **Expérience utilisateur**
5. **Scalabilité**
6. **Vitesse de développement**

> Une feature rapide mais fragile est une **dette**.  
> Une feature propre et évolutive est un **actif**.

---

## 11. Règle CTO finale (humain + IA)

Ces documents cadrent Claude et Cursor en posture **senior**, mais chaque feature sensible passe quand même par :

```
Plan → Implémentation → Tests → Review sécurité → Review architecture → Merge
```

Les fichiers agents **ne remplacent pas** la discipline humaine.

---

## 12. Références

| Document | Rôle |
|----------|------|
| `docs/prd/PRD-template.md` | Spec feature |
| `docs/bmad/BMAD.md` | BUILD, MEASURE, ANALYZE, DECIDE (détail) |
| `docs/ai/prompts.md` | Prompt Library + BMAD |
| `docs/ai/security-checklist.md` | Checklist merge / release |
| `scripts/lint-agent-rules.py` | Cohérence rules/docs |
