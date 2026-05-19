# Passport Scan & Redemption — intention UX (TICKET-306)

## 1. Émotion utilisateur

**Citoyen :** fierté tranquille — « je montre mon passeport, comme une carte de membre de ma ville », pas un coupon.

**Partenaire :** geste rapide et humain — « je valide quelqu’un du quartier », pas une caisse.

## 2. Flow citoyen

1. Ouvre Passport
2. **Présenter mon passeport** → QR plein écran, lumineux, lisible
3. Montre au partenaire — fin

## 3. Flow partenaire

1. **Scanner** ou **saisir le code**
2. Aperçu citoyen (prénom/ville masqués si besoin, numéro passport)
3. Choisir l’offre publiée de **son** lieu
4. Confirmer → succès ou refus **en langage humain**

## 4. Anti-patterns évités

- Interface caisse / POS
- Couponing cheap (codes barrés criards)
- Scan futuriste gadget
- Erreurs techniques (`pending_review`, codes HTTP visibles)
- Wallet crypto, offline, NFC, batch scan

## 5. Références UX (sensation)

| Référence | Pour |
|----------|------|
| Apple Wallet | Carte fullscreen, premium simple |
| BeReal | Rapidité, authentique |
| Notion | Clarté des états succès/refus |

## 6. Technique MVP (hors UI)

- QR statique (`YNCP1:` + token) — rotation = V2
- 1 redemption / passport / offre
- Isolation org (owner/admin)
- Audit via logs + metadata redemption
