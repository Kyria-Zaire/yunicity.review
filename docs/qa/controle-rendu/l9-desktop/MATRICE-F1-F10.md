# L9 — Matrice finitions C2 F1–F10

Référence : `C2-Lecteur-portrait.dc.html` / `C2-Lecteur-portrait.jpg`  
Environnement : **Next local** + **API simulée** (`_probe-l9-desktop-direct.mjs`)  
Captures : `APP-C2-comments-f1-f10-1440.png`, `APP-C2-f1-top32-apres-1440.png`

| # | Référence maquette | Modification | Preuve |
|---|-------------------|--------------|--------|
| F1 | Panneau `top: 32px` | Dialogue overlay `items-start pt-8` ; rangée portrait `items-start` si commentaires ouverts ; plus de `marginTop` cumulé | Sonde : `panelTop=32`, Δ vs 32 = **0** |
| F2 | `height: 836px` | `h-[836px]` | Sonde : `panelHeight=836` |
| F3 | Avatars 32 px + initiales | pastille `h-8 w-8` + `commentInitials` | `avatarCount=3` |
| F4 | Auteur `13px` + « · 1 h » | `text-[13px]` + `formatCommentRelativeTime` | `relativeTime=1` |
| F5 | Corps `14px` / `lh 20px` | `text-[14px] leading-5` | Code + capture |
| F6 | Input h44 + Send 44×44 | `h-11` input `#F7F8FA` + bouton `h-11 w-11` Send | `composerHeight=44` ; close 44×44 |
| F7 | Padding liste / header / form | `px-5` / `pl-5` / `pt-2.5` panel | Code + capture |
| F8 | « … » pastille blanche 48×48 | `moreStyle="desktop-c2"` `h-12 w-12 bg-white` | `moreWhite=true` |
| F9 | `aria-pressed` commentaires | `commentsPressed={commentsOpen}` | `commentsPressed="true"` |
| F10 | Compteur `#6B7280` / 600 | `font-semibold text-[#6B7280]` | Code + capture |

## Interactions / a11y

Fermeture panneau (✕ / Échap) + focus rail ; sheet mobile/medium inchangé.

## Réserve visuelle restante

`left: 811` maquette vs layout flex (mesuré ~797,5 en L8) — acceptabilité Preview groupée.
