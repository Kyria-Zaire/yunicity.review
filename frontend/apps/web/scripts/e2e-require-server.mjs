/**
 * Garde fail-closed du harnais E2E (C3.1-R1I).
 *
 * Playwright démarrait auparavant `pnpm dev` : toute preuve reposait donc sur un
 * serveur de développement, dont le cache de compilation croît sans borne et qui a
 * produit des rouges non reproductibles. Ce garde remplace cette commande : si le
 * serveur production-like n'est pas déjà là, le run échoue en nommant la commande
 * opérateur au lieu de fabriquer silencieusement un `next dev`.
 */
process.stderr.write(
  [
    "",
    "Le serveur web E2E n'est pas démarré (ou n'écoute pas sur le port attendu).",
    "Playwright ne démarre plus `next dev` : la preuve doit porter sur un serveur",
    "production-like (`next start` derrière la façade same-origin).",
    "",
    "Démarrez-le explicitement :",
    "    sh scripts/qa-web-server.sh",
    "",
  ].join("\n"),
);
process.exit(1);
