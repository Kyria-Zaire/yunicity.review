"use client";

import { useAccountDeletion } from "@/hooks/use-account-deletion";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  DELETE_ACCOUNT_CANCEL_HINT,
  DELETE_ACCOUNT_CANCEL_HINT_NO_EMAIL,
  DELETE_ACCOUNT_CONFIRM_LABEL,
  DELETE_ACCOUNT_CONFIRM_REQUIRED,
  DELETE_ACCOUNT_CONSEQUENCES,
  DELETE_ACCOUNT_INTRO,
  DELETE_ACCOUNT_PASSWORD_HINT,
  DELETE_ACCOUNT_PASSWORD_LABEL,
  DELETE_ACCOUNT_PASSWORD_REQUIRED,
  DELETE_ACCOUNT_SUBMIT,
  DELETE_ACCOUNT_SUBMITTING,
  DELETE_ACCOUNT_SUCCESS_TITLE,
  DELETE_ACCOUNT_TITLE,
  formatDeletionDate,
  humanizeAuthFailure,
} from "@yunicity/utils";
import { useState, type FormEvent } from "react";

/**
 * Section « Supprimer mon compte » — AUTH-02A.
 *
 * Ne s'affiche **que** si le backend déclare la fonctionnalité disponible. Tant
 * qu'elle ne l'est pas, la section n'existe pas : pas de titre, pas de bouton,
 * rien qui laisse croire qu'une suppression est possible.
 *
 * Aucune formule de conformité juridique n'est employée — cela relève d'une
 * qualification que l'interface n'a pas à trancher.
 */
export function AccountDeletionSection() {
  const { enabled, isLoading } = useAccountDeletion();
  const { yunicityApi } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(true);

  // Rien tant que le backend ne l'autorise pas — et rien pendant le chargement,
  // pour ne pas faire clignoter une section qui pourrait ne pas exister.
  if (isLoading || !enabled) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!password.trim()) {
      setValidationMessage(DELETE_ACCOUNT_PASSWORD_REQUIRED);
      return;
    }
    if (!confirmed) {
      setValidationMessage(DELETE_ACCOUNT_CONFIRM_REQUIRED);
      return;
    }

    setValidationMessage(null);
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const resultat = await yunicityApi.auth.requestAccountDeletion({
        password,
        confirm: true,
      });
      setScheduledFor(resultat.scheduled_for);
      setEmailSent(resultat.email_sent);
      setPassword("");
    } catch (erreur) {
      // Le backend renvoie une instruction précise pour les cas bloquants —
      // rôle d'administration, tribu sans successeur, abonnement actif — et
      // c'est elle qui doit s'afficher, pas un message générique.
      setErrorMessage(humanizeAuthFailure(erreur, "La demande n'a pas abouti."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (scheduledFor) {
    return (
      <section
        data-testid="account-deletion-done"
        aria-labelledby="suppression-titre"
        className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6"
      >
        <h2 id="suppression-titre" className="text-base font-semibold text-neutral-900">
          {DELETE_ACCOUNT_SUCCESS_TITLE}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700" role="status">
          Votre compte sera supprimé le <strong>{formatDeletionDate(scheduledFor)}</strong>.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {emailSent ? DELETE_ACCOUNT_CANCEL_HINT : DELETE_ACCOUNT_CANCEL_HINT_NO_EMAIL}
        </p>
      </section>
    );
  }

  return (
    <section
      data-testid="account-deletion"
      aria-labelledby="suppression-titre"
      className="rounded-2xl border border-red-200 bg-white p-4 sm:p-6"
    >
      <h2 id="suppression-titre" className="text-base font-semibold text-neutral-900">
        {DELETE_ACCOUNT_TITLE}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{DELETE_ACCOUNT_INTRO}</p>

      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-neutral-600">
        {DELETE_ACCOUNT_CONSEQUENCES.map((ligne) => (
          <li key={ligne}>{ligne}</li>
        ))}
      </ul>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-5 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-800">
            {DELETE_ACCOUNT_PASSWORD_LABEL}
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby="suppression-mdp-aide"
            className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-900 outline-none ring-yunicity-primary/30 transition focus:border-yunicity-primary focus:ring-2"
          />
          <span id="suppression-mdp-aide" className="mt-1 block text-xs text-neutral-500">
            {DELETE_ACCOUNT_PASSWORD_HINT}
          </span>
        </label>

        <label className="flex min-h-11 items-start gap-2.5 text-sm leading-relaxed text-neutral-700">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-neutral-300 text-yunicity-primary"
          />
          <span>{DELETE_ACCOUNT_CONFIRM_LABEL}</span>
        </label>

        {validationMessage ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {validationMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p
            className="rounded-lg bg-red-50 px-3 py-2 text-sm leading-relaxed text-red-700"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 w-full rounded-xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? DELETE_ACCOUNT_SUBMITTING : DELETE_ACCOUNT_SUBMIT}
        </button>
      </form>
    </section>
  );
}
