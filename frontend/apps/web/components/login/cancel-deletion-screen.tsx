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

type Etat = "verification" | "annulee" | "echec" | "sans-jeton";

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

  const [etat, setEtat] = useState<Etat>(() => (token?.trim() ? "verification" : "sans-jeton"));
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [renvoiFait, setRenvoiFait] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  // Un jeton ne se consomme qu'une fois : le double montage du mode strict ne
  // doit pas produire un « déjà utilisé » sur une annulation pourtant réussie.
  const consomme = useRef<string | null>(null);

  useEffect(() => {
    const brut = token?.trim();
    if (!brut || consomme.current === brut) return;
    consomme.current = brut;

    let annule = false;
    void (async () => {
      try {
        const reponse = await client.cancelAccountDeletion({ token: brut });
        if (!annule) {
          setEtat("annulee");
          setMessage(reponse.message);
        }
      } catch (erreur) {
        if (!annule) {
          setEtat("echec");
          setMessage(humanizeAuthFailure(erreur, "Ce lien d'annulation n'est plus valide."));
        }
      } finally {
        // Le jeton quitte la barre d'adresse : il partirait sinon dans
        // l'historique, les favoris et l'en-tête Referer. `replace` pour qu'un
        // retour arrière ne le ramène pas.
        if (!annule) router.replace("/login/cancel-deletion");
      }
    })();

    return () => {
      annule = true;
    };
  }, [client, router, token]);

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
          {etat === "verification" ? (
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
            : etat === "verification"
              ? "Annulation en cours"
              : "Lien d'annulation"}
        </h1>

        <p
          className="mt-3 text-center text-sm leading-relaxed text-neutral-600"
          role={etat === "verification" ? "status" : undefined}
          aria-live={etat === "verification" ? "polite" : undefined}
        >
          {etat === "verification"
            ? "Un instant, nous rétablissons votre compte…"
            : etat === "annulee"
              ? (message ?? "Votre compte est réactivé.")
              : etat === "echec"
                ? (message ?? "Ce lien n'est plus valide.")
                : "Saisissez l'adresse de votre compte pour recevoir un nouveau lien d'annulation."}
        </p>

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
