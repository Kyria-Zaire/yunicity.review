# Beta Observation Script — SPRINT-UX-01

| Champ | Valeur |
|-------|--------|
| Section | §7 — Beta Observation Protocol |
| Phase BMAD | **MEASURE** |
| Cible | 5–10 utilisateurs, **Reims** (ou ville profil Reims) |
| Durée session | 45–60 min (dont 30 min tâches guidées + 15 min entretien) |

---

## 1. Objectifs

| Objectif | Indicateur |
|----------|------------|
| Confusion navigation | Verbatims + échecs scénario |
| Fatigue | Abandon scroll, soupirs, « c’est long » |
| Incompréhensions | Questions spontanées répétées |
| Moments « wow » | Sourire, « ah cool », partage oral |
| Navigation spontanée | Chemins non prescrits |

**Hors scope session :** mesurer viralité, temps passé addictif, A/B design complet.

---

## 2. Profil participants

| Critère | Détail |
|---------|--------|
| N | 5 minimum, 10 idéal |
| Géo | Vit ou fréquente Reims |
| Âge | Mix 18–55 |
| Tech | 2 novices smartphone, reste confortable |
| Exclusion | Équipe Yunicity, orgs seed démo si conflit |

### Matériel

- iPhone ou Android avec **dev build** si test carte mobile Mapbox ; sinon **web mobile** pour carte.
- Compte démo : `demo@yunicity.dev` / `DemoReims1!Dev` (seed géolocalisé).
- Backend recette/dev stable, seed `--demo` appliqué.
- Enregistrement écran **avec consentement** RGPD.

---

## 3. Rôles équipe

| Rôle | Tâche |
|------|--------|
| Facilitateur | Consignes, neutre, pas d’aide sauf blocage > 2 min |
| Observateur | Notes temps, taps, verbatim |
| Preneur notes | Grille §6 |

---

## 4. Scénarios (ordre fixe)

### S0 — Accueil (5 min)

> « Vous découvrez Yunicity, une app pour vivre votre ville — moments locaux, quartiers, tribus. Pas de test de vous, on observe l’app. Pensez à voix haute. »

- Connexion compte démo ou compte créé avant session.
- **Ne pas** expliquer les onglets à l’avance.

---

### S1 — Découvrir un événement (8 min)

**Consigne :**  
> « Vous cherchez quelque chose à faire ce week-end à Reims. Trouvez un moment qui vous intéresse et dites pourquoi. »

**Succès :** ouverture fiche événement + expression d’intérêt (CTA ou équivalent).

**Observer :**

- Fil vs Moments vs Carte vs Recherche — quel chemin ?
- Compréhension dates / lieu ?
- CTA intérêt compris ?

**Métriques :** temps (s), taps, chemin (`feed` | `events` | `map` | `search`).

---

### S2 — Explorer un quartier (6 min)

**Consigne :**  
> « Vous venez d’emménager près du centre. Explorez votre quartier dans l’app. »

**Succès :** ouverture fiche quartier (`neighborhoods/[slug]`).

**Observer :** trouve-t-il Quartiers sans aide ? lien depuis fil ?

---

### S3 — Rejoindre une tribu (8 min)

**Consigne :**  
> « Vous avez reçu une invitation à une tribu locale (facilitateur envoie lien test). Rejoignez-la. »

**Succès :** membre tribu ou écran tribu compris.

**Observer :** friction invitation, longueur écran tribu, fatigue scroll.

**Fallback sans lien :** parcourir liste Tribus et ouvrir tribu publique seed.

---

### S4 — Utiliser la carte (7 min)

**Consigne :**  
> « Montrez-moi sur la carte où se passent des moments ce week-end. Ouvrez-en un. »

**Succès :** marqueur → détail événement.

**Observer :**

- Anxiété géoloc (question « il me suit ? ») — **doit rester absente**.
- Hint truncated compris ?
- Callout mobile vs popup web.

---

### S5 — Rechercher un lieu (6 min)

**Consigne :**  
> « Trouvez le Café du Centre (ou un lieu partenaire seed). »

**Succès :** résultat organisation ouvert ou identifié.

**Observer :** filtres recherche, confusion types, redirection Lieux tab.

---

### S6 — Comprendre Passport (8 min)

**Consigne :**  
> « Vous entendez parler du Passport Yunicity. À quoi ça sert pour vous à Reims ? Montrez dans l’app. »

**Succès :** explication à voix haute cohérente + écran Passport vu.

**Observer :** jargon, lien offres feed, scan partenaire (ne pas forcer scan réel).

---

### S7 — Navigation libre (5 min)

**Consigne :**  
> « Parcourez l’app comme vous voulez. »

**Observer :** onglets jamais visités, retours Fil, tentatives Proposer lieu.

---

## 5. Entretien de clôture (10 min)

1. En une phrase : c’est quoi Yunicity pour vous ?
2. Qu’est-ce qui vous a plu le plus ?
3. Qu’est-ce qui vous a fatigué ou embrouillé ?
4. Est-ce que ça ressemble à Facebook / TikTok / autre ? Pourquoi ?
5. Recommanderiez-vous à un ami à Reims ? (0–10)
6. Un changement **petit** qui aiderait demain ?

---

## 6. Grille d’observation (par participant)

Copier une grille par user : `P01` … `P10`.

| Champ | Valeur |
|-------|--------|
| ID | |
| Date | |
| Device | Web / iOS / Android |
| Scénario | S1–S7 : ✅ / ⚠️ / ❌ + temps + taps |
| Confusion (quotes) | |
| Fatigue (quotes) | |
| Wow (quotes) | |
| Nav spontanée | |
| P0 suspect ? | oui/non + note |

---

## 7. Signaux à compiler (post-sessions)

| Signal | Agrégation |
|--------|------------|
| Chemin dominant → événement | % map vs events vs feed |
| Tab bar confusion | count questions « c’est quoi Passport » |
| Carte anxiogène | count questions géoloc |
| Parité mobile event feed | count « je ne vois pas la différence » |
| NPS Reims | moyenne Q5 |

Alimenter : [ux-hardening-audit.md](./ux-hardening-audit.md) matrice P0/P1 et [product-coherence-report.md](./product-coherence-report.md).

---

## 8. Éthique & données

- Consentement écrit observation + enregistrement.
- Pas de données prod réelles ; comptes démo ou test.
- Notes anonymisées dans rapport (ID seulement en interne).

---

## 9. Checklist pré-session

- [ ] Seed `--demo` + events géolocalisés Reims
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN` / `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`
- [ ] API health OK
- [ ] Lien invitation tribu test prêt
- [ ] Grilles imprimées ou Notion
- [ ] Facilitateur briefé : **ne pas vendre** le produit pendant tâches

---

*Après 5 sessions minimum → session ANALYZE BMAD avec CTO / product.*
