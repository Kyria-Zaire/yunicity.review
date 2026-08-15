# Yunicity — Design Contract C3.0 (« Le pouls du quartier »)

> **Source de vérité** de la refonte C3.0. Gelé en C3.0-T2. Toute surface DOIT
> consommer ce contrat et les tokens `@yunicity/ui` — aucune surface n'invente ses
> styles. Base : `origin/main@0268886`. Doctrine amont : `docs/ai/frontend-design-system.md` (306F).
>
> Ce document **spécifie** ; il n'implémente aucune page. Sources visuelles **canoniques
> validées** : `docs/ux/c3-0/mockups/` — **Feed V2** (Fil) et **Navbar V3** (chrome/nav) font autorité.

## 0. Direction

**Yunicity — Le pouls du quartier.** Réseau social local **éditorial, chaleureux,
énergique et fiable**. Blanc dominant, bleu `#2A2FFF` pour guider l'action.
Interdits durables : **gradients décoratifs, glassmorphism** (scrim fonctionnel
autorisé uniquement pour la lisibilité média), néons, purple AI-slop, dark blocks
fintech, sur-utilisation du bleu. Une idée directrice par écran, une action primaire.

## 1. Responsive — 390 / 900 / 1366

| Palier | Largeur | Chrome | Contenu |
|--------|---------|--------|---------|
| **Mobile** | 390 (base <640) | header sticky + **bottom-nav** ; surfaces détail immersives | 1 colonne, `content: feed/full` |
| **Medium** | 900 (640–1279) | chrome persistant (rail compact ou header) ; **layout dédié** (ne plus « agrandir le mobile ») | 1 colonne large + rail contextuel optionnel |
| **Desktop** | 1366 (≥1280) | header + **rail de navigation** + rail contextuel droit | shell `max 87.5rem` (1400px), colonnes 15rem / contenu / 18rem |

Breakpoint pivot **640px**. Migration progressive vers un layout **tokenisé** (largeurs/rails
via tokens `content-*`, `rail-*`) — remplacer graduellement le mécanisme `web-*-only` de `globals.css`.

## 2. Navigation (architecture V3 — définitive)

**4 destinations principales** (bottom-nav mobile / rail medium+desktop) :

1. **Fil local** · 2. **Vidéos** · 3. **Carte** · 4. **Sortir**

- **« Créer »** : action **persistante** (FAB mobile / bouton chrome desktop), **pas** un 5ᵉ onglet.
- **« Explorer Reims »** : porte la **recherche globale**.
- **« Menu Yunicity »** : **toujours explicitement visible** —
  - mobile : bouton **« Menu »** dans le header sticky ;
  - medium : bouton **« Menu »** dans le chrome persistant ;
  - desktop : bouton **« Menu Yunicity »** dans le header.
- Le **Menu Yunicity** expose les fonctions secondaires **existantes** : Passport, quartiers,
  tribus, offres, notifications, discussions, publications, profil, paramètres, aide.
- **Aucun contrôle décoratif ou sans comportement réel.**

> Mapping technique existant : `apps/web/lib/layout/web-layout-config.ts`
> (`WEB_CITIZEN_NAV_PRIMARY` / `_SECONDARY` / `_YUNICITY_MENU`). L'implémentation de la V3
> est **hors périmètre T2** (ticket ultérieur).

### Stories (module du Fil)

- La section **Stories est obligatoire** sur **390, 900 et 1366**.
- Stories est un **module du Fil local**, **pas** une cinquième destination principale.
- Création d'une Story accessible depuis **« Votre story »** et **« + Créer »**.

### Précédence des sources visuelles

- **Feed V2** (`docs/ux/c3-0/mockups/yunicity-feed-responsive-v2.png`) = source de vérité du
  **contenu et du responsive du Fil** (Stories incluses).
- **Navbar V3** (`…/yunicity-navigation-architecture-v3.png`) = source de vérité du
  **chrome global et de la navigation**.
- En cas de divergence avec une ancienne planche, **Feed V2 et Navbar V3 prévalent**.

## 3. Chrome — sticky, safe-area, rails

- **Header** : sticky, hauteur `--yunicity-header-height` (3.5rem) ; contient marque, Explorer Reims, Menu Yunicity, notifications, compte.
- **Bottom-nav** (mobile) : fixe bas, hauteur `--yunicity-bottom-nav-height` (4rem) ; padding contenu réservé via token ; **safe-area** : `padding-bottom: max(1rem, env(safe-area-inset-bottom))`, header `env(safe-area-inset-top)`.
- **Rail navigation** (desktop) : `--yunicity-rail-nav` (15rem), sticky.
- **Rail contextuel** (desktop droite) : `--yunicity-rail-context` (18rem), sticky, contenu réel uniquement (tribus, quartier…).
- **Z-index** : `dropdown 10 < sticky 20 < drawer 40 < modal 50 < popover 60 < toast 70` (tokens `z.*`).

## 4. Largeurs de contenu

`form 36rem · readable 42rem · wide 48rem · shell 87.5rem` (tokens `content.*` / `maxWidth yunicity-*`).
Ne jamais étirer un formulaire au-delà de `form`. Shell citoyen ≤ `shell` centré.

## 5. Typographie & espacement

- **Échelle typo** (à substituer aux `text-[10px]/[11px]` ad hoc) : corps 14–16px web / 16px+ mobile ; titres tracking serré modéré. Micro-texte ≥ 12px (accessibilité) — **bannir `text-[10px]`**.
- **Espacement** : échelle **4/8px** (`space.1..12` : 4, 8, 12, 16, 20, 24, 32, 48).

## 6. Couleurs sémantiques (tokens)

`brand/brandHover/brandSoft/accent` · `canvas/surface/surfaceElevated` ·
`textPrimary/Secondary/Muted/Inverse` · `border/divider/focusRing` ·
`success/warning/danger/info` (+ `*Soft`) · `premium*` (Passport) — **surface navy pleine validée DA
`#0B1533`** (sans gradient, sans glassmorphism). **Aucun hex ad hoc** : consommer les tokens
(`bg-yunicity-*`, `var(--yunicity-*)`, `yunicitySemantic`).

## 7. Rayons, bordures, ombres

Rayons `sm .375 / md .5 / lg .75 / xl 1rem (carte) / 2xl 1.5rem (hero) / pill`.
Bordures via `border`/`divider`. Ombres **sobres** `sm/md/lg` (pas d'ombres lourdes). Cartes imbriquées ≤ 2 niveaux.

## 8. Motion & prefers-reduced-motion

Motion **fonctionnelle uniquement** (clarifie l'action/état). Durées `fast 150 / base 200 / slow 300ms` ;
easing `standard cubic-bezier(0.2,0,0,1)`. Pas de parallax/scroll-jacking/loaders brandés infinis.
**`prefers-reduced-motion: reduce`** → durées 0 (déjà câblé dans `brand.css`).

## 9. Accessibilité

- **Focus visible** partout (`focusRing`, `:focus-visible`), navigation clavier complète, focus-trap des overlays.
- **Contraste** WCAG 2.1 AA (≥ 4.5:1 texte). **Cibles tactiles ≥ 44px** (`--yunicity-touch-min`).
- Landmarks (`header`/`nav`/`main`), titres de page, ordre de tabulation logique, annonces `aria-live` loading/error.

## 10. États obligatoires par surface data-driven

`loading` (skeleton, **pas** loader plein écran — cf. UX-FE-01) · `empty` (message + CTA) ·
`error` (message FR + retry) · `offline` (bannière + rétention) · `unauthenticated` (gate → login,
jamais un écran cassé). `success` avec feedback si mutation.

## 11. FOMO éthique (règle stricte)

Toute **urgence, popularité, disponibilité, proximité** affichée **DOIT** provenir d'une donnée
backend réelle (cf. C3-F0). **Signaux autorisés** : échéance offre flash (`flash_ends_at`),
proximité temporelle événement (`starts_at`), état saved/interested, nombre **réel** de
membres/intéressés, notif non-lue (`unread_count`), partenaire vérifié (`verification_status`),
nouveauté sur timestamp réel.

**Interdits absolus** : faux compteurs, faux participants, fausse rareté/stock, faux délais/compte
à rebours, « X personnes regardent », popularité fabriquée, badge vérifié factice, **contenu fictif
ajouté pour embellir**. Si la donnée est absente → **ne rien afficher** (pas d'invention).

## 12. Références

Tokens : `@yunicity/ui` (`yunicitySemantic`, `brand.css`, `tailwind-preset`).
Doctrine : `docs/ai/frontend-design-system.md`. Baseline visuelle : `docs/ux/c3-0/mockups/`.
Contrats données : `docs/ops/c3-f0-functional-baseline.md`.
