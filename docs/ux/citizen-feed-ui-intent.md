# Citizen Feed — intention UX (TICKET-403)

## 1. Émotion recherchée

**Calme utile** — le citoyen ouvre Yunicity et ressent la vie de *sa* ville, pas le bruit d’un réseau global.

- Proximité : « des voisins et des lieux que je reconnais »
- Confiance : modération possible, pas de chaos visuel
- Respiration : le regard se repose, rien ne crie pour l’attention
- Utilité : un partage ou une offre peut m’aider concrètement aujourd’hui

Éviter : FOMO, compétition sociale, urgence artificielle.

## 2. Structure du feed

Ordre vertical unique, chronologique **ville-first** (déjà côté API) :

1. **Composer** compact en tête (citoyen MVP)
2. **Cartes** espacées (`gap` généreux) — post citoyen, post organisation, offre Passport
3. **Charger plus** explicite (pas d’infinite scroll agressif)
4. **États** : chargement → liste → vide chaleureux → erreur récupérable

Pas de colonnes multiples de contenu, pas de stories, pas de reels.

## 3. Rythme visuel

- Fond blanc / surface `#F7F8FA`, accent `#2A2FFF` parcimonieux
- Une carte = un souffle : padding 20–24px, `rounded-2xl`, bordure légère `#E5E7EB`
- Typo : titre auteur 15–16px semibold, corps 15px line-height confortable
- Métadonnées (ville, date) en `textSecondary`, petite taille
- Actions (like, commenter, signaler) en ligne discrète sous le contenu

## 4. Hiérarchie contenu / offres

| Type | Rôle visuel |
|------|-------------|
| Post citoyen | Humain — avatar/initiale, prénom, corps texte |
| Post organisation | Lieu — logo optionnel, nom du lieu, ton institutionnel doux |
| Offre Passport | Opportunité locale — badge Passport discret, commerce, titre, avantage, expiration légère, CTA secondaire |

Les offres ne sont **pas** des pubs : pas de bandeau promo, pas de couleur criarde, pas de « -50% » géant.

## 5. Empty states

Message principal (exemple) :

> Votre ville est encore calme. Soyez le premier à partager une découverte locale.

Sous-texte orienté action : inviter à publier via le composer, rappeler que les offres Passport apparaîtront au fil des partenaires.

Pas de fausses activités ni de posts système spam.

## 6. Anti-patterns évités

- Clone TikTok (vidéo plein écran, swipe addiction)
- Clone X (timeline dense, débats hostiles mis en avant)
- Mur Facebook (multiples réactions, partages, commentaires imbriqués)
- Dashboard SaaS (KPI, graphiques dans le rail)
- Machine à dopamine (animations like, compteurs énormes, badges « trending »)
- Gradients, glassmorphism, dark patterns de rétention

## 7. Usage WebAppShell

- Route `/feed` avec `contentWidth="feed"`
- Header : titre « Fil local » + sous-titre ville si connue
- Sidebar gauche existante ; feed centré `max-w-2xl`
- Rail droit : panneaux calmes (`WebContextPanel`) — ville, activité locale, règles communauté, découvrir Yunicity — **sans KPI**

## 8. Usage mobile

- Onglet principal **Fil** — référence UX produit
- `FlatList` + pull-to-refresh, fond clair aligné brand (Passport)
- Commentaires : expansion inline ou section sous la carte (pas de bottom sheet lourd MVP)
- Tap targets ≥ 44px, contrastes WCAG

## 9. Philosophie « slow local social »

Yunicity privilégie la **qualité de la proximité** sur la quantité d’engagement :

- Peu de types de contenu, bien modérés
- Pas d’algorithme de ranking opaque (ville-first + date suffisent)
- Pas de notifications likes/comments dans ce MVP
- Le feed densifie naturellement via offres publiées et posts citoyens

Le rythme est celui d’une **place de village numérique**, pas d’une timeline mondiale.

## 10. Pourquoi Yunicity n’est pas TikTok / Facebook

| Réseau classique | Yunicity |
|------------------|----------|
| Portée globale, viralité | Ville-first, ancrage local |
| Algorithme opaque | Ordre explicite (ville puis date) |
| Métriques mises en avant | Compteurs discrets, pas de classement |
| Contenu infini auto-play | Scroll volontaire, « Charger plus » |
| Monétisation attention | Offres = avantages citoyens Passport |
| Modération opaque | Signalement simple, workflow staff |

---

**Suite technique** : `packages/types` + `feed-api`, composants web `apps/web/components/feed`, mobile `apps/mobile/components/feed`, routes `/feed` et onglet `(tabs)/feed`.
