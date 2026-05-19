# Notifications sociales — intention UX (TICKET-503)

## 1. Rôle émotionnel

**Reconnexion humaine au fil local** — « quelqu’un a réagi à ce que j’ai partagé sur le territoire », sans pression ni spectacle.

- Feedback réel, pas vanity metrics
- Sentiment d’appartenance calme
- Confiance dans l’écosystème Yunicity

## 2. Rappel humain vs spam algorithmique

| Rappel humain (Yunicity) | Spam algorithmique (refusé) |
|--------------------------|-----------------------------|
| Une action = une personne | Agrégats « 47 personnes… » |
| Texte sobre, prénom si connu | « Votre post explose 🔥 » |
| Rare et pertinent | Toutes les 30 secondes |
| Opt-out simple par catégorie | Dark patterns de réactivation |
| Ouvre le fil / le contexte local | « Revenez maintenant » |

**Règle** : la notification doit **sembler méritée** — interaction humaine identifiable.

## 3. Rareté et valeur

- Pas de regroupement agressif en MVP (une notif = une action)
- Cooldown simple anti-doublon (même acteur, même post, fenêtre courte)
- Préférences : social / passport / offers — désactivables
- Inbox = historique calme, pas feed addictif

## 4. Ton Yunicity

- Calme, territorial, premium, crédible
- Titre push : **Yunicity**
- Corps : factuel, court, en français
- Pas d’emoji agressifs, pas de rouge « badge casino »

## 5. Bonnes / mauvaises notifications

| Bon | Mauvais |
|-----|---------|
| « Marie a commenté votre publication. » | « Trending près de chez vous ! » |
| « Quelqu’un a aimé votre publication. » | « Votre post devient viral » |
| « Votre Passport évolue — niveau Silver. » | « LEVEL UP 🔥🔥 » |
| Tap → fil local | Pop-up intrusif web |

## 6. Gestion de fréquence

- Ne jamais notifier ses propres actions
- Cooldown MVP sur doublons rapides
- Respect des préférences JSON (`social`, `passport`, `offers`)
- Pas de websocket / typing / seen en temps réel

## 7. Anti-patterns

- Instagram/TikTok notification spam
- Badges rouges énormes, infinite loops
- AI ranking des notifs, trending, FOMO
- Browser push complexe (hors scope web MVP)

## 8. Notifications et identité locale

Les notifications renvoient au **fil citoyen** et au **territoire** — pas à une machine d’engagement globale. Elles soutiennent la vie locale (posts, Passport), pas le scroll infini.

## 9. Philosophie « calm social »

Le social Yunicity est **lent et crédible**. Les notifications accompagnent ce rythme : elles informent, elles ne harcèlent pas.

## 10. Pourquoi Yunicity refuse les dark patterns

La rétention par interruption détruit la confiance territoriale. Yunicity choisit la **sérénité produit** : une notification de plus ne doit jamais être une manipulation — seulement un lien vers une interaction réelle.

---

**Références** : `docs/product/social-notifications.md`, `social_notification_service.py`.
