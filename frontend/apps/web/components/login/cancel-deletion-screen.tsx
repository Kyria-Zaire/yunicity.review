"use client";

import { YunicityLogo } from "@/components/brand";
import {
  MemoryTokenStorage,
  createAuthClient,
  getWebApiBaseUrl,
  humanizeAuthFailure,
} from "@yunicity/utils";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

type Etat =
  /** Jeton reçu, en attente du clic de confirmation. Aucune requête émise. */
  | "confirmation"
  /** Requête en cours ; le bouton est désactivé, pas de double soumission. */
  | "envoi"
  | "annulee"
  | "echec"
  | "sans-jeton";

export function CancelDeletionScreen() {
  return (
    <Suspense fallback={null}>
      <CancelDeletionScreenInner />
    </Suspense>
  );
}

/**
 * Annulation d'une suppression de compte — AUTH-02A.
 *
 * Le lien reçu par e-mail n'annule RIEN par lui-même : il charge cette page, qui
 * envoie ensuite un POST. Un scanner de messagerie qui précharge le lien
 * récupère du HTML sans exécuter de script, et le compte reste donc en attente
 * — c'est la même architecture que la vérification d'adresse.
 */
function CancelDeletionScreenInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const client = useMemo(
    () =>
      createAuthClient({
        apiBaseUrl: getWebApiBaseUrl(),
        platform: "web",
        storage: new MemoryTokenStorage(),
      }),
    [],
  );

  const [etat, setEtat] = useState<Etat>(() =>
    token?.trim() ? "confirmation" : "sans-jeton",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [renvoiFait, setRenvoiFait] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  // Le jeton est gardé EN MÉMOIRE, jamais consommé au montage.
  const jetonEnMemoire = useRef<string | null>(null);

  useEffect(() => {
    const brut = token?.trim();
    if (!brut) return;

    // AUCUNE requête ici. Un scanner de messagerie qui exécute le JavaScript de
    // la page — certains produits de sécurité le font — annulerait sinon la
    // suppression à la place de l'utilisateur. Seul un clic consomme le jeton.
    jetonEnMemoire.current = brut;

    // Il quitte en revanche la barre d'adresse immédiatement : il partirait
    // sinon dans l'historique, les favoris et l'en-tête Referer. `replace`
    // pour qu'un retour arrière ne le ramène pas.
    router.replace("/login/cancel-deletion");
  }, [router, token]);

  async function handleConfirmation() {
    const brut = jetonEnMemoire.current;
    if (!brut || etat === "envoi") return;

    setEtat("envoi");
    try {
      const reponse = await client.cancelAccountDeletion({ token: brut });
      setEtat("annulee");
      setMessage(reponse.message);
      // Le jeton est consommé : on ne le garde pas pour un second clic.
      jetonEnMemoire.current = null;
    } catch (erreur) {
      setEtat("echec");
      setMessage(humanizeAuthFailure(erreur, "Ce lien d'annulation n'est plus valide."));
      jetonEnMemoire.current = null;
    }
  }

  async function handleRenvoi(event: FormEvent) {
    event.preventDefault();
    setEnvoiEnCours(true);
    try {
      const reponse = await client.resendCancellationLink({ email });
      setRenvoiFait(reponse.message);
    } catch {
      // Volontairement silencieux : distinguer les issues révélerait qui a
      // demandé la suppression de son compte.
      setRenvoiFait(
        "Si une suppression est en cours pour cette adresse, vous allez recevoir un nouveau lien d'annulation.",
      );
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F4F5F7] px-4 py-12">
      <div
        data-cancel-state={etat}
        className="w-full max-w-md rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-4 flex justify-center">
          <YunicityLogo size="lg" />
        </div>

        <div className="mb-4 flex justify-center" aria-hidden>
          {etat === "envoi" ? (
            <Loader2 className="h-8 w-8 animate-spin text-yunicity-primary motion-reduce:animate-none" />
          ) : etat === "annulee" ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          ) : (
            <ShieldAlert className="h-8 w-8 text-neutral-400" />
          )}
        </div>

        <h1 className="text-center text-xl font-bold text-neutral-900 sm:text-2xl">
          {etat === "annulee"
            ? "Suppression annulée"
            : etat === "confirmation" || etat === "envoi"
              ? "Annuler la suppression ?"
              : "Lien d'annulation"}
        </h1>

        <p
          className="mt-3 text-center text-sm leading-relaxed text-neutral-600"
          role={etat === "envoi" || etat === "annulee" || etat === "echec" ? "status" : undefined}
          aria-live={etat === "envoi" || etat === "annulee" || etat === "echec" ? "polite" : undefined}
        >
          {etat === "envoi"
            ? "Un instant, nous rétablissons votre compte…"
            : etat === "confirmation"
              ? "Votre compte sera réactivé et la suppression abandonnée. Vous devrez vous reconnecter."
              : etat === "annulee"
                ? (message ?? "Votre compte est réactivé.")
                : etat === "echec"
                  ? (message ?? "Ce lien n'est plus valide.")
                  : "Saisissez l'adresse de votre compte pour recevoir un nouveau lien d'annulation."}
        </p>

        {etat === "confirmation" || etat === "envoi" ? (
          <button
            type="button"
            data-testid="confirmer-annulation"
            onClick={() => void handleConfirmation()}
            disabled={etat === "envoi"}
            className="mt-6 min-h-11 w-full rounded-xl bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {etat === "envoi" ? "Annulation en cours…" : "Annuler la suppression"}
          </button>
        ) : null}

        {etat === "annulee" ? (
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="mt-6 min-h-11 w-full rounded-xl bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Se connecter
          </button>
        ) : null}

        {etat === "echec" || etat === "sans-jeton" ? (
          <form onSubmit={(event) => void handleRenvoi(event)} className="mt-6 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-neutral-800">
                Adresse de votre compte
              </span>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-900 outline-none ring-yunicity-primary/30 transition focus:border-yunicity-primary focus:ring-2"
              />
            </label>
            {renvoiFait ? (
              <p
                className="rounded-lg bg-neutral-50 px-3 py-2 text-sm leading-relaxed text-neutral-700"
                role="status"
                aria-live="polite"
              >
                {renvoiFait}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={envoiEnCours}
              className="min-h-11 w-full rounded-xl border border-yunicity-primary px-4 py-3 text-sm font-semibold text-yunicity-primary transition hover:bg-yunicity-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {envoiEnCours ? "Envoi…" : "Recevoir un nouveau lien"}
            </button>
          </form>
        ) : null}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-semibold text-yunicity-primary hover:underline"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </main>
  );
}
