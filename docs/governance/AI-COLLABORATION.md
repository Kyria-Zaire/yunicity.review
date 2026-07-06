# Standard de collaboration humain–IA

| Champ | Valeur |
|-------|--------|
| ID | DOC-GOV-01 |
| Version | 1.0.1 |
| Statut | **DRAFT** — en attente séquence de validation (voir § Procédure d'adoption) |
| Portée | IMORIA (écosystème) |
| Première adoption | Yunicity |

---

## 0. Principe d'ouverture

> Ce document décrit une méthode de collaboration. Il ne décrit pas des outils. Les modèles d'IA peuvent évoluer, les responsabilités restent les mêmes.

---

## 6. Champ d'application

Ce standard couvre les activités de :

- **conception** (DISCOVER, PRD, audits read-only)
- **architecture** (ADR, contrats API, modèle de données, infra)
- **développement** (BUILD, tests, migrations)
- **revue** (PR, correctness, dette)
- **documentation** (sync doc, archives, rapports)
- **gouvernance** (décisions structurantes, escalade, standards)

**Précédence :** en cas de conflit avec une procédure spécialisée du projet (ADR, RFC, checklist sécurité, workflow release, PRD gates, BMAD…), **la procédure spécialisée prévaut pour son domaine**. Ce document fixe le cadre de collaboration ; il ne remplace pas les règles métier ou techniques détaillées.

**Réutilisation IMORIA :** le corps du standard (§0–§3) est identique pour Yunicity, YURPASS, SharingGO et les futurs projets. Seule l'**Annexe — Configuration actuelle** est adaptée par projet.

### Non-objectifs

Ce standard **ne définit pas** :

- les standards de code (style, lint, patterns d'implémentation)
- les conventions Git (branching, messages de commit, stratégie de merge)
- les politiques sécurité détaillées (checklists, zones rouges, contrôles par endpoint)
- les procédures de release (promotion d'environnements, rollback, monitoring post-deploy)
- les choix techniques propres à un projet (stack, infra, schéma DB, contrats API)

Ces sujets relèvent de **documents spécialisés** du projet concerné (ex. workflow release, checklist sécurité, ADR technique, règles Cursor/CLAUDE) — auxquels ce standard renvoie sans les remplacer.

### Couche d'exécution IA

Le présent document définit la **gouvernance de la collaboration** — qui décide, qui valide, comment tracer et escalader.

Son application opérationnelle repose également sur une **couche d'exécution** propre à chaque projet, composée notamment de règles (*rules*), skills, playbooks, guides opérationnels et instructions d'exécution.

Cette couche précise le comportement attendu des agents IA lors de l'exécution : préparation, développement, revue, documentation, sécurité, QA, déploiement, et activités connexes.

Les artefacts d'exécution peuvent **évoluer indépendamment** afin d'améliorer les workflows ou d'intégrer de nouveaux outils, à condition de rester cohérents avec les principes définis par le présent standard.

**Précédence :** en cas de conflit de **gouvernance** (rôles, authorities, validation, escalade), le présent document **prévaut**. Les règles d'exécution **précisent sa mise en œuvre** sans le remplacer.

---

## 1. Principes

Les sections ci-dessous décrivent des pratiques **réellement observées** sur Yunicity — notamment VIDEO-01, VIDEO-01B, MEDIA-INFRA-V1, VIDEO-03A, VIDEO-DOCS-SYNC-01 et les Reality Checks. Elles ne prescrivent pas de mécanismes non éprouvés.

### 1.1 Rôles

Cinq rôles fonctionnels. Une même personne peut en cumuler plusieurs. Un agent IA peut assister Execution et Review, mais **ne cumule jamais une Authority humaine**.

| Rôle | Nature | Mandat |
|------|--------|--------|
| **Product Authority** | Humain | *Pourquoi*, scope MVP, priorités, critères d'acceptation, GO prod |
| **Architecture Authority** | Humain | Décisions structurantes, ADR, contrats API, infra, intégrité technique |
| **Execution Agent** | IA supervisée | Implémente et documente *dans* le scope validé |
| **Review Agent** | IA et/ou humain | Contrôle qualité, cohérence spec, préparation merge — ne merge pas |
| **QA-Security Agent** | IA et/ou humain | Tests, smoke, checklist sécurité — signale les zones rouges |

### 1.2 Responsabilités, limites et interactions

#### Product Authority

| | |
|---|---|
| **Responsabilités** | Valider PRD et gates BUILD ; prioriser P0–P2 ; GO/NO-GO recette et prod publique ; arbitrer conflits de scope |
| **Limites** | Ne produit pas le code ; ne contourne pas ADR ni checklist sécurité ; ne valide pas seul une zone rouge technique |
| **Interactions** | Consulte Architecture Authority sur faisabilité ; reçoit synthèses Reality Checks ; tranche avec Founder si désaccord L3 |

*Précédent :* Reality Checks (RC-01 à RC-06) → roadmap FEATURE-ROADMAP-POST-RC validée Founder + CTO avant exécution REALITY-FIX et CREATORS-V2.

#### Architecture Authority

| | |
|---|---|
| **Responsabilités** | Approuver ADR ; valider contrats API publics ; imposer « code mergé = vérité » ; valider provisionnement infra manuel |
| **Limites** | Ne merge pas sans review ; ne provisionne pas via l'IA (buckets, secrets, DNS = humain ops) ; ne décide pas du scope produit seul |
| **Interactions** | Émet ADR avant BUILD structurant ; consulte Product Authority si impact UX ou délai ; déclenche STOP BUILD en zone rouge |

*Précédent :* VIDEO-03A — ADR worker async **avant** implémentation ; INFRA-01 — checklist Cloudflare exécutée par humain, tokens Railway hors git.

#### Execution Agent

| | |
|---|---|
| **Responsabilités** | Lire spec + ADR + code existant ; produire le plus petit diff correct ; marquer faits / hypothèses / propositions ; tester les chemins modifiés |
| **Limites** | Pas de merge autonome ; pas de décision produit ou architecture ; pas de commit/PR/ticket inventé ; STOP si gate manquant ou zone rouge |
| **Interactions** | Reçoit ticket scoped ; répond au Review Agent ; escalade L2 à Architecture Authority ; documente dans le ticket ou la PR |

*Précédent :* VIDEO-DOCS-SYNC-01 — scope doc strict, zéro code ; chaque ligne doc reliée à un commit ou ticket mergé.

#### Review Agent

| | |
|---|---|
| **Responsabilités** | **Challenge** le livrable (PR, draft, audit) ; **questionne** les écarts spec ↔ code ; **identifie** risques, dette et régressions ; **formule** des recommandations classées (suggestion vs à traiter avant merge) |
| **Limites** | **Ne dispose pas d'un droit de veto** — ses remarques sont un input, pas une décision ; ne remplace pas validation humaine au merge ; ne tranche pas conflit spec ↔ ADR (escalade L2) ; ne merge pas |
| **Interactions** | Échange structuré L1 avec Execution Agent ; prépare la revue humaine ; peut solliciter QA-Security ; en cas de blocage persistant → escalade selon Authority Matrix, **arbitrage final Founder** (L3b) |

*Précédent :* PR #72 (VIDEO-03A) — review pré-merge : idempotence worker, timeout job, smoke polling robuste. Les corrections ont été intégrées avant merge ; la décision merge est restée **humaine**.

*Clarification :* le Review Agent **challenge, questionne, identifie, recommande** — il **n'interdit pas** seul un merge. L'arbitrage appartient au Founder conformément à l'Authority Matrix (§2.1, §2.3 L3b).

#### QA-Security Agent

| | |
|---|---|
| **Responsabilités** | Tests CI/smoke ; checklist sécurité zones rouges ; codes de sortie explicites ; rapport factuel (faits vs hypothèses) |
| **Limites** | GO ops et GO prod = humain ; ne patch pas prod ; ne désactive pas contrôles sécurité sans Authority |
| **Interactions** | Bloque L4 avec Architecture Authority ; informe Product Authority si impact release ; exécute scripts, humain valide EXIT 0 |

*Précédent :* MEDIA-INFRA-V1 — smoke R2 recette, exit 0/6/7 ; validation humaine du GO opérationnel.

### 1.3 Workflow de collaboration

Cycle observé sur tickets structurants (Local Video, post-Reality Check) :

```
1. DISCOVER / AUDIT (read-only)
      → faits mesurés, écart spec ↔ code, pas de code
2. DESIGN
      → PRD + ADR + gates (§13 ou équivalent)
3. VALIDATION AVANT EXÉCUTION
      → Product Authority + Architecture Authority : GO BUILD explicite
4. BUILD (Execution Agent)
      → code + tests + .env.example + doc ticket
5. REVIEW
      → Review Agent + humain ; PR obligatoire
6. QA / SECURITY
      → CI, smoke, checklist si zone rouge
7. MERGE → deploy dev → recette → preprod → prod
8. DOCUMENTATION SYNC (si drift doc/code)
      → ticket doc dédié ; code reste référence
9. MEASURE → ANALYZE → DECIDE (post-deploy)
```

**Validation avant exécution (règle absolue) :** pas de BUILD code tant que gates produit et architecture du ticket ne sont pas satisfaits ou qu'une dérogation n'est pas **écrite** par l'Authority compétente.

**Ticket documentation only :** gates réduits — scope fichiers, tickets/commits sources, interdiction de modifier le code applicatif sauf demande explicite (cf. VIDEO-DOCS-SYNC-01).

### 1.4 Distinction faits · hypothèses · propositions

Tout livrable IA significatif (audit, plan, rapport, description PR) **sépare explicitement** :

| Catégorie | Définition | Exemple observé |
|-----------|------------|-----------------|
| **Fait** | Vérifiable repo, infra ou artefact daté | « `POST /local-videos` → HTTP 202 depuis merge PR #72 » |
| **Hypothèse** | Non validée, marquée comme telle | « Worker Railway suffit pour charge pilote Reims » |
| **Proposition** | Recommandation non décision | « Renommer VIDEO-04 Engagement → VIDEO-05 » |

**Ordre de priorité :** faits > hypothèses. Les propositions deviennent décisions **uniquement** après validation humaine (ticket, ADR, commentaire GO).

*Précédent Reality Checks :* notes RC chiffrées = faits ; roadmap post-RC = propositions jusqu'à validation Founder + CTO.

### 1.5 Documentation as Code

Pratiques observées et stabilisées :

| Règle | Précédent |
|-------|-----------|
| Doc versionnée dans le repo | Tous tickets VIDEO, ops, ADR |
| Décision structurante → ADR datée avec statut | VIDEO-03A : `PROPOSED` → `IMPLEMENTED` |
| Drift doc/code → ticket sync doc, pas de fix silencieux | VIDEO-DOCS-SYNC-01 |
| Code mergé = source de vérité ; doc suit | Rapport VIDEO-DOCS-SYNC-01 §0 |
| Obsolète → archive + stub ; jamais supprimer | `docs/_archive/` + stub C1-B1 |
| Secrets jamais dans git | INFRA-01, `.env.example` sans valeurs réelles |
| Dette documentée dans ticket dédié | VIDEO-03B (backoff ARQ) |

---

## 2. Gouvernance des décisions

### Schéma de gouvernance

Flux décisionnel observé — de la vision à la livraison. Les flèches indiquent **délégation et validation**, pas exécution technique seule.

```
                    Founder
                 (arbitrage L3b)
                       │
              Product Authority
                       │
            Architecture Authority
                       │
         ┌─────────────┼─────────────┐
         │             │             │
      Review        Execution    QA-Security
      (challenge)   (BUILD)      (tests, smoke)
         │             │             │
         └─────────────┼─────────────┘
                       │
                  Merge (humain)
```

Le Founder intervient en arbitrage lorsque Product Authority et Architecture Authority ne convergent pas (L3b). Le merge reste **toujours** une action humaine.

### 2.1 Authority Matrix

| Type de décision | Authority primaire | Consultation | Validation requise | Traçabilité |
|------------------|-------------------|--------------|-------------------|-------------|
| **Produit** — scope MVP, priorité | Product Authority | Architecture | GO écrit ou statut PRD | Ticket / PRD |
| **Produit** — ouverture prod publique | Product Authority | QA-Security, Architecture | GO Founder si impact majeur | Ticket + checklist release |
| **Architecture** — ADR, schéma DB, intégration | Architecture Authority | Product | ADR `APPROVED` | ADR |
| **Architecture** — contrat API public | Architecture Authority | Product | ADR ou PRD §6 à jour | ADR + OpenAPI/schemas |
| **Architecture** — provisionnement cloud | Architecture Authority (humain ops) | — | Exécution manuelle checklist | Checklist ops datée |
| **Sécurité** — zone rouge (auth, upload, PII, prod…) | Architecture Authority + Product Authority | QA-Security | Review sécurité humaine | Checklist + PR |
| **Sécurité** — dérogation contrôle | Architecture Authority | Product, QA-Security | Écrit ; durée limitée | Ticket ou ADR amendement |
| **Urgent** — incident secret / fuite / prod | Architecture Authority | Product Authority, Founder | STOP immédiat ; pas de BUILD parallèle | Ticket incident + post-mortem |
| **Urgent** — hotfix prod | Architecture Authority | Product Authority | Validation CTO/Founder ; rollback prêt | PR hotfix + ticket |
| **Exécution** — implémentation ticket scoped | Execution Agent | Review Agent | Gates BUILD OK | PR + tests |
| **Merge** branche principale | Humain (owner PR) | Review Agent | Review humain obligatoire | Merge commit |
| **Documentation** — sync post-merge | Execution Agent (ticket doc) | Architecture Authority | Scope doc validé | Rapport + PR doc |

**IA :** peut **proposer** dans toutes les lignes ; ne **valide** aucune ligne où l'Authority est humaine.

### 2.2 Validation des décisions

Une décision est **valide** pour l'écosystème si et seulement si :

1. Elle est **tracée** (ADR, ticket, ou commentaire GO daté sur ticket/PR).
2. L'**Authority primaire** correspondante a explicitement approuvé (statut ADR, gate coché, GO ops).
3. Aucune escalade L3/L4 ouverte ne la contredit.

**Stabilité des décisions :** une décision validée reste la **référence** jusqu'à ce qu'une **révision explicite** (ADR amendée ou superseded, ticket de gouvernance, nouvelle version du standard) la remplace. Un ticket d'exécution ultérieur **ne modifie pas implicitement** une règle, un gate ou une ADR antérieure — toute évolution doit être tracée (cf. §2.5 scénario A, § Évolution du standard).

**Validation avant exécution** — checklist minimale BUILD code :

- [ ] Ticket ou PRD identifié, scope in/out borné
- [ ] Gates BUILD cochés (spec, archi, risques, permissions, endpoints, DB si applicable)
- [ ] ADR applicable existante (`APPROVED` ou `IMPLEMENTED`) ou exemption Architecture Authority documentée
- [ ] Pas de conflit ouvert avec ADR/ticket antérieur (voir §2.5)
- [ ] Zone rouge : checklist sécurité planifiée ou N/A documenté

#### Vérification de l'état réel

Un statut déclaré (« terminé », « validé », « mergé », « déployé ») ne constitue pas, à lui seul, une preuve suffisante.

Un gate ou une décision n'est considéré comme **valide** que lorsque son état réel a été **vérifié** à l'aide d'un élément objectif approprié au contexte — par exemple : merge effectif sur la **branche de référence**, CI verte, build réussi, déploiement confirmé, ou preuve équivalente.

En cas de divergence entre un statut déclaré et l'état réel vérifié, **l'état réel prévaut**. Le gate reste **ouvert** jusqu'à résolution et traçabilité de l'écart.

*Précédent :* VIDEO-01B — ticket annoncé terminé alors que le code ne reflétait pas encore l'état réel (clés storage) ; correction après vérification repo, pas après seule déclaration de statut.

### 2.3 Escalade des désaccords

| Niveau | Situation | Résolution | Délai indicatif |
|--------|-----------|------------|-----------------|
| **L1** | Interprétation ticket / spec | Review Agent ↔ Execution Agent | 1 échange structuré |
| **L2** | Spec ambiguë ou contradictoire avec ADR | Architecture Authority tranche | Avant nouveau code |
| **L3** | Conflit produit ↔ technique | Product Authority + Architecture Authority | Écrit (ticket ou ADR) |
| **L3b** | Désaccord persistant L3 | **Arbitrage Founder** (Kyria) | Décision finale produit/vision |
| **L4** | Sécurité, prod, PII, secret exposé | STOP BUILD — Architecture + QA-Security | Immédiat |

**Principe observé :** doute zone rouge → défaut **NO-GO** jusqu'à validation humaine explicite (doctrine CTO Yunicity).

### 2.4 Décisions par domaine

#### Décisions produit

- Source : Reality Checks, feedback terrain, Founder.
- Format : PRD, roadmap (ex. FEATURE-ROADMAP-POST-RC), commentaire GO sur ticket.
- Exemple : gate « pas de CREATORS-V2 prod sans RF-02 + RF-03 » — décision produit documentée, pas inférée du code.

#### Décisions architecture

- Source : contraintes techniques, dette, scale (ex. FFmpeg sync → async).
- Format : ADR obligatoire si difficile à inverser ou transverse.
- Exemple : VIDEO-03A — ADR avant worker ; statut `IMPLEMENTED` après merge PR #72.

#### Décisions sécurité

- Source : checklist projet, zones rouges, incident.
- Format : review PR + tests ; pas de merge zone rouge sans humain.
- Exemple : uploads Local Video — MIME, taille, presigned, pas de secret côté client (VIDEO-01).

#### Décisions urgentes

- **Incident critique** (secret commité, fuite bucket, prod down) :
  1. STOP toute exécution IA sur le périmètre concerné
  2. Architecture Authority + Founder informés
  3. Rotation secrets / rollback selon runbook — **humain ops**
  4. Post-mortem tracé (ticket incident)
- **Hotfix** : branche dédiée, scope minimal, review accélérée **mais non contournée**, rollback documenté.

### 2.5 Scénarios réels déjà rencontrés

#### A. Ticket livré mais contradictoire avec une décision existante

**Situation observée :** doc PRD indique HTTP 201 sync publish ; code post-VIDEO-03A retourne HTTP 202 async.

**Règle :**

1. **Fait** : code mergé prime sur doc obsolète.
2. **Action** : ticket sync doc (VIDEO-DOCS-SYNC-01) — pas de « revert code pour matcher doc » sans ADR/ticket produit.
3. **Review Agent** signale la contradiction en PR ou audit ; **Architecture Authority** confirme quelle source fait foi.
4. Execution Agent sur ticket suivant **ne réintroduit pas** le comportement obsolete sans nouvelle ADR.

#### B. Challenge d'une décision d'architecture après lancement d'un ticket

**Situation observée :** ticket BUILD lancé ; découverte que FFmpeg in-process ne tient pas la prod → challenge → ADR VIDEO-03A.

**Règle :**

1. **STOP** ou **pause** BUILD si le challenge remet en cause le fondement du ticket.
2. Architecture Authority : met à jour ou crée ADR ; statut ticket → « blocked pending ADR » ou scission ticket (ex. VIDEO-03A extrait de VIDEO-01).
3. Product Authority : arbitrage délai/scope si ADR change le MVP (ex. polling client reporté VIDEO-04C).
4. Reprise BUILD **uniquement** après ADR `APPROVED` et mise à jour gates ticket.

#### C. Incident critique (secret, sécurité, production)

**Situation observée :** tokens R2 injectés Railway hors git ; règle stricte jamais credentials dans repo ou doc.

**Règle :**

1. **L4 immédiat** — Execution Agent n'exécute pas de « quick fix » prod autonome.
2. Révocation / rotation par humain ops (Architecture Authority).
3. QA-Security Agent : grep audit, pas de secret dans diff.
4. Founder informé si impact utilisateurs ou légal (PII).
5. Tracer : ticket incident ; mise à jour checklist si lacune.

### 2.6 Traçabilité via ADR ou ticket

| Artefact | Quand l'utiliser | Contenu minimal |
|----------|------------------|-----------------|
| **Ticket** | Toute unité de travail | ID, feature, phase BMAD, scope in/out, critères acceptation, liens ADR |
| **ADR** | Décision structurante, difficile à inverser | Contexte, décision, alternatives rejetées, conséquences, statut |
| **Ticket gouvernance / doc** | Standard, sync doc, audit | Rapport, fichiers touchés, commits/tickets sources |
| **PR + merge commit** | Livraison | Lien ticket, test plan, reviewers humains |

**Règle :** une décision structurante non tracée **n'existe pas** pour l'écosystème IMORIA — elle ne peut pas être invoquée lors d'un audit ou d'un conflit ultérieur.

**Arbitrage Founder :** lorsque Product Authority et Architecture Authority restent en désaccord après L3, le Founder (Kyria) tranche. La décision est consignée sur le ticket ou via amendement ADR/PRD — pas uniquement en conversation orale.

---

## 3. Traçabilité des principes

> Ce tableau est volontairement non exhaustif et doit être complété à chaque nouveau ticket établissant un précédent.

| Principe | Ticket(s) source |
|----------|------------------|
| Validation avant exécution — gates BUILD avant code | PRD-CREATORS-V2, BMAD |
| Code mergé = source de vérité ; documentation synchronisée après | VIDEO-DOCS-SYNC-01 |
| Upload presigned direct client → stockage ; pas de binaire via API en prod | VIDEO-01, ADR-CREATORS-V2 |
| Clés objet résolues dynamiquement (`city_slug`) | VIDEO-01B |
| Infra cloud provisionnée par humain ; IA produit checklists et docs | MEDIA-INFRA-V1, INFRA-01 |
| Décision structurante documentée en ADR avant implémentation | VIDEO-03A |
| Traitement async hors requête HTTP (publish 202 + worker) | VIDEO-03A (PR #72) |
| Worker déployé comme service séparé de l'API | INFRA-03 (PR #73) |
| Smoke bout-en-bout avec codes de sortie explicites | MEDIA-INFRA-V1 |
| GO ops validé par humain après smoke | MEDIA-INFRA-V1 |
| Audit read-only (Reality Checks) avant roadmap d'exécution | FEATURE-REALITY-CHECK-V1 |
| WOW produit conditionné au substrat terrain (REALITY-FIX avant CREATORS-V2 prod) | FEATURE-ROADMAP-POST-RC |
| Scope documentation isolé — aucun code modifié | VIDEO-DOCS-SYNC-01 |
| Archivage documentaire sans suppression | VIDEO-DOCS-SYNC-01 |
| Dette technique traçée dans ticket dédié, pas de correction silencieuse | VIDEO-03B |
| Distinction tickets backend mergés vs client UX ouvert | VIDEO-DOCS-SYNC-01 (VIDEO-04A–D) |
| Review pré-merge sur cas limites (idempotence, timeout, polling) | VIDEO-03A (review PR #72) |
| Distinction faits / hypothèses / propositions dans livrables IA | Reality Checks, VIDEO-DOCS-SYNC-01 |
| Secrets et tokens exclus du repo et de la documentation | INFRA-01, MEDIA-INFRA-V1 |
| Synthèse des pratiques de collaboration IMORIA | Précédents documentés ci-dessus (Reality Checks, VIDEO-01→03A, VIDEO-DOCS-SYNC-01) — ce standard en est la formalisation, sans auto-référence comme ticket source |

### Index des tickets sources

| ID | Domaine |
|----|---------|
| FEATURE-REALITY-CHECK-V1 | Audit produit terrain (RC-01 à RC-06) |
| FEATURE-ROADMAP-POST-RC | Roadmap et gates post-audit |
| VIDEO-01 | Storage R2, readiness pipeline |
| VIDEO-01B | Clés storage dynamiques |
| MEDIA-INFRA-V1 | Smoke infra recette |
| INFRA-01 | Checklist provisionnement Cloudflare |
| INFRA-03 | Déploiement worker Railway |
| VIDEO-03A | Worker async ARQ |
| VIDEO-03B | Dette documentée backoff ARQ |
| VIDEO-DOCS-SYNC-01 | Synchronisation documentation Local Video |

---

## Évolution du standard

Toute modification de ce document :

- **suit la même procédure de review** que l'adoption initiale (§ Procédure d'adoption) ;
- est **versionnée** (numéro de version + entrée §5 Historique des révisions) ;
- **documente les changements** (ticket de gouvernance, ex. DOC-GOV-01.1) ;
- **ne modifie jamais rétroactivement** les décisions historiques — les ADR, tickets et merges antérieurs restent valides tels qu'enregistrés ; seule une révision explicite d'un artefact donné le remplace.

*Précédent :* VIDEO-DOCS-SYNC-01 conserve des sections « état avant merge » plutôt que de réécrire l'historique ; ADR VIDEO-03A marque le contexte synchrone comme note historique post-implémentation.

---

## 4. Configuration actuelle

> **Annexe indépendante et datée.** Modifier cette section **ne modifie pas** les principes §1–§3.  
> Pour YURPASS, SharingGO ou un nouveau projet IMORIA : dupliquer cette annexe sous le même format.

| Champ | Valeur |
|-------|--------|
| Projet | Yunicity |
| **Dernière mise à jour** | **2026-06-29** |

### Mapping rôle → personne / agent

| Rôle | Titulaire actuel | Notes |
|------|------------------|-------|
| Product Authority | Founder + Kyria (CTO) | GO/NO-GO prod, scope MVP, Reality Checks |
| Architecture Authority | Kyria (CTO) | ADR, infra, gates techniques, arbitrage L2–L4 technique |
| Founder (arbitrage L3b) | Kyria | Tranchage final produit/vision si L3 bloqué |
| Execution Agent | Agent d'exécution IA (supervisé) | BUILD ticket scoped ; pas de merge autonome |
| Review Agent | Agent de revue IA + humain requis au merge | Revue contradictoire recommandée sur standards |
| QA-Security Agent | Agent QA IA + validation humaine GO | Smoke, checklist ; zones rouges = humain |

### Canaux de validation observés (Yunicity)

| Type | Canal |
|------|-------|
| GO BUILD / scope | Commentaire ticket ou validation Founder/CTO |
| ADR | Statut dans `docs/adr/` ou `docs/architecture/` |
| Merge code | PR → branche principale, review humain |
| GO ops recette | Smoke EXIT 0 + checklist INFRA-01 |
| Sync documentation | Ticket doc + rapport `docs/ops/` |

### Adoption IMORIA

| Projet | Annexe config | Statut |
|--------|---------------|--------|
| Yunicity | §4 ci-dessus | Draft v1.0.1 |
| YURPASS | *À créer lors de l'adoption* | — |
| SharingGO | *À créer lors de l'adoption* | — |

---

## 5. Historique des révisions

| Version | Date | Changement |
|---------|------|------------|
| **v1.0** | 2026-06-29 | Création du standard — ancrage pratiques observées Yunicity (VIDEO-01→03A, MEDIA-INFRA-V1, VIDEO-DOCS-SYNC-01, Reality Checks) |
| **v1.0.1** | 2026-06-29 | DOC-GOV-01.1 — corrections review CTO (non-objectifs, stabilité décisions, évolution standard, Review Agent, schéma gouvernance, traçabilité) |

---

## Procédure d'adoption (DOC-GOV-01)

Ce document est un **standard fondateur**. Il ne doit **pas** être mergé sans la séquence suivante :

| Étape | Acteur | Statut |
|-------|--------|--------|
| 1. Draft | Cursor (Execution Agent) | ✅ v1.0 draft |
| 2. Review CTO | ChatGPT | ✅ v1.0.1 — DOC-GOV-01.1 intégré |
| 3. Review contradictoire | Claude | ☐ En attente |
| 4. Validation Founder | Kyria | ☐ En attente |
| 5. Merge | Humain | ☐ Interdit avant étapes 2–4 |

Après validation Founder : passer le statut metadata de `DRAFT` à `APPROVED` dans une révision v1.0 amendée ou v1.0.1 selon corrections.

---

## Références projet Yunicity (non normatives)

Ces documents **complètent** le standard sans le remplacer :

| Document | Rôle |
|----------|------|
| `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` | Flow Idea → Production |
| `docs/bmad/BMAD.md` | BUILD → MEASURE → ANALYZE → DECIDE |
| `docs/prd/PRD-template.md` | Gates §13 |
| `docs/ai/security-checklist.md` | Revue sécurité |
| `docs/ops/VIDEO-DOCS-SYNC-01-report.md` | Exemple ticket sync doc |
