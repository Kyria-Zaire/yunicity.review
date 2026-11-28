# POSTGRES-SERVER-LOGS-EXPOSURE-01 · Configuration et exposition des journaux du serveur Postgres

⛔ **ZONE ROUGE (infrastructure, données dans les journaux)** · ouvert le
2026-11-06 depuis `APP-DEBUG-SQL-ECHO-TOKENS-01` · **non examiné**.

## Pourquoi

Les messages d'erreur Postgres citent des valeurs (`APP-SQL-ERROR-VALUES-01`).
Le serveur peut les consigner dans **son propre journal**, en fonction de sa
configuration (`log_min_messages`, `log_min_error_statement`,
`log_error_verbosity`, `log_statement`, `log_parameter_max_length*`…). Ce chemin
est **hors de portée de l'application**.

## État

- **Journaux du serveur Postgres (QA, Preview) : NON examinés.**
- Configuration effective et accès à ces journaux (qui peut les lire, rétention) :
  **non établis**.
- Production : **gelée**, hors périmètre sans demande explicite de Kyria.

## Première étape

Sur décision de Kyria : relire la **configuration** de journalisation des
Postgres QA et Preview, **sans intervenir sur l'infrastructure** et **sans
exporter de journaux**. Présenter ensuite le constat et les options.
