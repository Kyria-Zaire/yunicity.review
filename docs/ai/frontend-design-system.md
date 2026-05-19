# Frontend design system — doctrine IA Yunicity (TICKET-3050)

Source canon pour agents Cursor / Claude avant tout frontend significatif (surtout **TICKET-305B** Partner Offers UI).

Skills externes de référence (installées via `npx skills add`) :

| Skill | Focus |
|-------|--------|
| `emilkowalski/skill` | Motion intentionnelle, easing, reduced motion |
| `pbakaus/impeccable` | Layout, spacing, typo, hiérarchie |
| `Leonxlnx/taste-skill` | Anti-slop, intention produit, review goût |

Règles repo : `.cursor/rules/14-frontend-design-system.mdc` ↔ `.claude/rules/14-frontend-design-system.md`

---

## 0. Official Yunicity Brand Identity (TICKET-306F)

**Source unique des couleurs** : `frontend/packages/ui/src/brand-tokens.ts` (`yunicityBrand`), CSS ` @yunicity/ui/brand.css`, Tailwind `yunicity-*` via `@yunicity/ui/tailwind-preset`.

### Positionnement visuel

- Réseau social territorial **moderne**, humain, respirant, local, premium sobre.
- **Dominante blanche** — surfaces aérées, pas de mur de couleur.
- **Bleu primaire `#2A2FFF`** — guide l’attention (CTA, liens, nav active, accents Passport), **sans saturation**.

### Palette officielle

| Token | Hex | Usage |
|-------|-----|--------|
| Primary | `#2A2FFF` | CTA, liens, états actifs |
| Primary hover | `#1F24D9` | Survol boutons |
| Primary soft | `#EEF0FF` | Fonds accent discrets |
| Background | `#FFFFFF` | Fond page |
| Surface | `#F7F8FA` | Cartes secondaires, zones QR |
| Border | `#E5E7EB` | Contours |
| Text primary | `#111827` | Titres, corps |
| Text secondary | `#6B7280` | Sous-textes |
| Success / Warning / Danger | `#16A34A` / `#D97706` / `#DC2626` | États métier |

### Interdits (durables)

- **Gradients** (`bg-gradient*`, `linear-gradient`) — interdit.
- Glassmorphism / `backdrop-blur` décoratif — interdit.
- Néons, purple AI slop, dark blocks agressifs (cartes type fintech).
- Surutilisation du bleu (tout en primary).
- Étirement formulaires sur 4K — utiliser `WebContentColumn` / `contentWidth`.

### Règles futures (feed, events, messaging…)

1. Importer `yunicityBrand` ou classes `yunicity-*` — **pas de hex ad hoc**.
2. Une action primaire bleue par zone ; le reste en neutre.
3. Conserver la respiration (spacing 4/8px, cartes simples).
4. Web citoyen : `WebAppShell` + `contentWidth` (`feed`, `form`, `readable`).
5. Mobile : `constants/brand.ts` → `@yunicity/ui/brand`.

### Ce que Yunicity n’est pas

Crypto, fintech, dashboard SaaS froid, gaming flashy, couponing cheap.

---

## 1. Design positioning

Yunicity UI doit être :

- **mobile-first**
- **premium mais chaleureux** (pas froid corporate)
- **territorial** — ancré ville / quartier / lieux
- **social** — preuve humaine, confiance, proximité
- **simple** — une action principale par écran
- **crédible** pour partenaires locaux (café, asso, commerce)

Ne doit **pas** ressembler à :

- dashboard SaaS froid (gris plat, sidebar dense, métriques vides)
- crypto wallet / fintech agressive
- couponing cheap (codes barrés, rouge promo criard)
- admin Bootstrap générique
- purple gradient « AI slop » (voir §0 — **gradients interdits**)
- CRM enterprise lourd (tables sans respiration)

### Par surface produit

| Surface | Ton visuel | Idée directrice |
|---------|------------|-----------------|
| **Passport** | Carte identité locale, fierté citoyenne | « Ma ville me reconnaît » |
| **Partner offers** | Outil pro léger, confiant | « Je publie une offre pour ma ville » |
| **Admin CRM** | Linear / Notion — sobre, rapide | « Je modère avec clarté » |
| **Org onboarding** | Accueillant, rassurant | « Rejoindre le territoire » |
| **Mobile social** | Feed vivant, respirant | « Ma ville bouge » |

---

## 2. Motion rules (emil-design-eng)

- Motion **uniquement** si elle clarifie l’action ou le changement d’état.
- Durées courtes : **150–250 ms** UI ; **300–400 ms** modales max.
- Easing doux (`ease-out` / courbes custom légères) — pas de bounce gratuit.
- Pas d’animation décorative sur listes longues ou formulaires.
- Pas de micro-interactions qui ralentissent la tâche (soumission offre, validation modération).
- **`prefers-reduced-motion`** : désactiver ou réduire transitions non essentielles.
- Pas de parallax, pas de scroll-jacking, pas de loaders « brandés » infinis.

---

## 3. Layout / spacing / typography (Impeccable)

- **Hiérarchie claire** : un titre fort, un sous-texte, une action primaire.
- **Vertical rhythm** : échelle 4/8px (4, 8, 12, 16, 24, 32, 48).
- **Densité contrôlée** : admin = compact mais aéré ; mobile = touch-friendly.
- **Espaces respirables** : marges latérales cohérentes ; pas de mur de cartes identiques.
- **Typo** : titres lisibles (tracking serré modéré) ; corps 14–16px web, 16px+ mobile.
- **Cartes** : une idée par carte ; éviter cartes imbriquées > 2 niveaux.
- **Grilles** : 1 col mobile → 2 max tablette partenaire → admin desktop si besoin.
- **Contraste** WCAG AA — tokens `@yunicity/ui` quand disponibles.

---

## 4. Taste / anti-slop

- Chaque écran a **une idée directrice** (une phrase) avant le code.
- Pas de sections « marketing template » (hero générique + 3 colonnes icônes).
- Pas de composants sans rôle (badges décoratifs, stats à 0).
- Pas de copie SaaS vide (« Optimize your workflow »).
- **Design review obligatoire** avant implémentation frontend P1/P2 (voir checklist §6).
- Préférer **substance locale** (ville, lieu, offre, statut) à la décoration.

---

## 5. Image-to-code workflow

Pour interfaces non triviales (> 1 écran ou nouveau flux) :

1. **Référence** — capture, wireframe, ou mood (Linear, Notion, carte physique).
2. **Analyse** — noter hiérarchie, spacing, CTA, états, ce qui est absent.
3. **Intention** — documenter en 5–10 lignes (fichier PRD ou commentaire ticket).
4. **Implémentation** — composants + états ; pas l’inverse.
5. **Review** — comparer à l’intention, pas seulement « ça compile ».

---

## 6. Gate TICKET-305B (Partner Offers Self-Service UI)

**Avant tout code UI 305B**, l’agent doit livrer (dans le ticket ou PR) :

1. **Intention UX** (1 paragraphe, ton chaleureux pro)
2. **Structure écran(s)** (liste, détail, création, soumission, retour modération)
3. **Composants** (réutilisation `@yunicity/ui`, admin patterns existants)
4. **États** : loading, empty, error, success, pending_review, rejected
5. **Responsive** : mobile-first partenaire ; breakpoints
6. **Anti-patterns évités** (liste explicite tirée de ce doc)

Refus automatique si : CRUD admin froid copié sans adaptation partenaire.

---

## 7. Checklist design review (avant merge UI)

- [ ] Une action primaire évidente
- [ ] États loading / empty / error / success
- [ ] Français utilisateur, pas de jargon SaaS
- [ ] Spacing échelle 4/8px cohérent
- [ ] Pas de nested cards inutiles
- [ ] Motion justifiée + reduced motion
- [ ] Aligné surface (Passport / Partner / Admin / Mobile)
- [ ] Pas d’« AI slop » visuel

---

## Liens

- Règle agents : `14-frontend-design-system`
- UI constructeur : `07-constructeur-ui`
- UX base : `08-ui-ux-pro-max`
- Frontend stack : `frontend-next-expo`
