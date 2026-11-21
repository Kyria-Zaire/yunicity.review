# Rapport — VIDEO-REFONTE-L8-DESKTOP-LECTEUR-01

**Statut** : BUILD local **ACCEPTÉ / SUSPENDU** (15/11) — R-FOCUS, structure C2, 1024, Entrée/gestes lien OK ; finitions typo C2 → L9 ; **NON clos** ; aucun commit / push / deploy.  
**Environnement preuves** : app Next réelle `localhost:3002` + API **simulée** (Playwright route).  
**Base** : tip Preview `3b1586bb` / code `e49f4bb4` + diff L7 non commité (conservé).

---

## 1. Livrable

Lecteur desktop **superposé** sur la grille L7 (C2 / C3 / C5 / C6), contrats D1 / D3 / D4 / D5, R-ORD / R-VIDE / R-FOCUS.

| Mesures refs (canvas 1440×900) | Valeur |
|---|---|
| Voile | `rgba(17,24,39,0.85)` (C2/C3/C6) |
| C2 vidéo | ~470×836, hauteur ≈ 836/900 du viewport |
| C3 cadre | **800×600** confirmé sur `C3-Lecteur-paysage.dc.html` |
| C6 | placeholder 470×836, `aria-busy`, ✕ actif |
| C2 panneau commentaires | latéral blanc **380×828**, `presentation="panel"`, sans Drawer Lot 4 |

---

## 2. Cause R-FOCUS Δ11 px (mesurée) et correctif

| Observation | Valeur |
|---|---|
| Avant ouverture | `scrollY=217` (= maxY), `scrollHeight=1117`, vignette `p1` à `top=-11` (partiellement hors cadre) |
| Après fermeture (avant correctif) | `scrollY=206`, `scrollHeight` **stable** 1117, focus `p1` — Δ **11** |
| Cause | le focus du lien recentrait la vignette **avant** la marque au `click` → sticky/session enregistrait 206 ; la restore rejouait 206. Un ancien `scrollIntoView(nearest)` aggravait le cas. |
| Correctifs | (1) capture scroll au `mousedown` + `preventDefault` (pas de recentrage focus) ; (2) sticky non écrasé si déjà posé ; (3) restore : `focus({preventScroll})` uniquement, `scrollTo(y)` sans pré-clamp `maxY`, re-pins annulables ; (4) sonde max-scroll : ouverture sans focus-scroll Playwright |
| Assertion sonde | `delta <= 1` (PRD e2e) + focus vignette attendue |
| Mesure après correctif | **Δ 0** (`rfocus-max-scroll`), repeats / Retour / Avance / ✕ : Δ 0 |

Contrat R-FOCUS **non assoupli**.

---

## 3. Commentaires — écart Lot 4 vs C2 (appartenance)

| | Sheet Lot 4 | Référence C2 / L8 |
|---|---|---|
| Placement | tiroir **bas** plein largeur (`Drawer` `data-yunicity-overlay="bottom"`) | panneau **latéral** à droite de la vidéo |
| Dimensions (mesurées 1440×900) | ~60–90 dvh × 100 % largeur | **380×828** (`min(380px,28vw)`, hauteur `min(836px,92dvh)`) |
| Comportement | overlay bottom, clavier visualViewport | `presentation="panel"` dans `<aside>`, pas de Drawer ; paysage C3 garde la sheet Lot 4 |
| Référence | Lot 4 (mobile/medium) | **C2 ∈ Lot 8** (CADRAGE §C2, PRD R-PAN desktop) |

**Décision de classement** : le **placement / dimensions / absence de sheet** appartiennent à **L8** — corrigés (`presentation="panel"`, aside 280–380 px).  
**Écart résiduel** : typo / espacements / chrome vs maquette C2 pixel — **non déclarés conformes** ; polish éventuel **consigné pour L9** (ou revue visuelle CTO), sans bloquer le contrat structurel C2 L8.  
C4 / C7 / D2 restent **Lot 9**.

---

## 4. Fichiers

| Fichier | Rôle |
|---|---|
| `videos-desktop-overlay-player.tsx` | Overlay C2/C3/C6 + panneau commentaires + lock scroll |
| `desktop-overlay-navigation.ts` (+ tests) | R-ORD / R-VIDE / R-FOCUS / capture scroll mousedown |
| `use-ordered-video-navigation.ts` | Séquence S + ▼ budget 3 pages |
| `use-video-overlay-history.ts` | D1 push/replace/back/replace |
| `use-grid-restore.ts` | Scroll + focus `preventScroll`, re-pins annulables |
| `videos-desktop-grid-tile.tsx` | `scroll={false}`, mousedown mark, click clavier |
| `video-comments-sheet.tsx` | `presentation: sheet \| panel` |
| `videos-screen.tsx` | Desktop `?video=` → overlay |
| `use-local-videos-feed.ts` | `newIds` pour R-ORD / R-VIDE |
| `videos-responsive-shell.tsx` | Titre grille focalisable R-FOCUS |

**Non touchés** : fil medium L5, immersif mobile, correctifs Safari. C4/C7/D2 → Lot 9. **L7 conservé**.

---

## 5. Preuves

### Unitaires (`vitest`)

`desktop-overlay-navigation.test.ts` + `video-desktop-l8-overlay.test.tsx` : **18/18**.

### App Next + API simulée

Script : `frontend/apps/web/scripts/_probe-l8-desktop-overlay.mjs`  
JSON : `preuves-app.json` · log : `probe-post-rfocus-v8.log` · captures : `captures-app/`

| Cas | Résultat |
|---|---|
| C2 portrait 1440 / 1280 / **1024** | OK |
| C3 paysage idem | OK |
| Échap / ✕ / Retour / Avance | OK — focus dernière vue |
| `rfocus-repeats` (×3) | OK — Δ 0, focus `p2` |
| `rfocus-max-scroll` | OK — **Δ 0** (tolérance ±1) |
| `c2-comments-panel` | OK — panel 380 px, presentation=panel, 0 drawer |
| `controls-1024` portrait + paysage | OK — play / nav / close / share |
| Direct orphan / no autoplay | OK |
| Medium 820 / mobile 390 | OK — pas d’overlay desktop |

**Rapport sonde** : `ok: true`, `failures: []`, **20** cas.

### Provenance

| Élément | Provenance |
|---|---|
| Captures `captures-app/` | **réelle** (Next + Chromium) + API **simulée** |
| Maquettes C2/C3 | référence géométrie (pas pixel-perfect) |
| Vitest | jsdom, mocks navigation / media |

---

## 6. Réserves

1. **C2 pixel-perfect** : structure OK ; typo/espacements maquette — **non conformes pixel**, polish → L9 / revue visuelle.
2. **Hint « Voir les vidéos du fil »** : timing sonde parfois 0 si S pas encore hydratée.
3. **C4 / C7 / D2** : hors L8 (Lot 9).
4. **Safari desktop / RC-D1 manuel** : non joués (Preview groupée 7+8+9).

---

## 7. Diff

`VIDEO-REFONTE-L8-DESKTOP-LECTEUR-01-precommit.diff` (régénéré après correctifs R-FOCUS / commentaires).  
Diff L7 **conservé** sous `../l7-desktop/`.

---

## 8. Finalisation gestes (15/11)

`preuves-a11y-link-gestures.json` : Entrée → overlay + R-FOCUS Δ 0 ; Ctrl/Cmd → nouvel onglet (`video=`) sans overlay ici ; milieu sans `preventDefault` ; tap tactile OK. Aucune régression → **pas de correctif code**.

## 9. Prochaine action

L8 suspendu. Ticket actif : **L9 cadrage**. Preview uniquement avec **7+8+9**. Production / `main` hors périmètre.
