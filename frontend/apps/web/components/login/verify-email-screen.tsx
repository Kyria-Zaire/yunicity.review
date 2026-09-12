"use client";

import { YunicityLogo } from "@/components/brand";
import { VerifyEmailResendForm } from "@/components/login/verify-email-resend-form";
import {
  MemoryTokenStorage,
  VERIFY_EMAIL_LOGIN_CTA,
  VERIFY_EMAIL_LOGIN_LINK,
  VERIFY_EMAIL_PENDING_HINT,
  VERIFY_EMAIL_RESEND_DONE,
  buildEmailVerificationView,
  buildResendVerificationPayload,
  createAuthClient,
  forgetPendingVerificationEmail,
  getWebApiBaseUrl,
  readPendingVerificationEmail,
  resolveInitialVerificationStatus,
  resolveVerificationFailure,
  validateResendVerificationEmail,
  type EmailVerificationStatus,
} from "@yunicity/utils";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

export function VerifyEmailScreen() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailScreenInner />
    </Suspense>
  );
}

function VerifyEmailScreenInner() {
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

  const [status, setStatus] = useState<EmailVerificationStatus>(() =>
    resolveInitialVerificationStatus(token),
  );
  const [email, setEmail] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  // Un jeton n'est consommable qu'une fois : le double montage du mode strict en
  // developpement ne doit pas declencher deux requetes, dont la seconde
  // afficherait « lien deja utilise » sur une verification pourtant reussie.
  const consumedToken = useRef<string | null>(null);

  useEffect(() => {
    setEmail((current) => current || (readPendingVerificationEmail() ?? ""));
  }, []);

  useEffect(() => {
    const raw = token?.trim();
    if (!raw || consumedToken.current === raw) {
      return;
    }
    consumedToken.current = raw;

    let cancelled = false;
    void (async () => {
      try {
        await client.verifyEmail({ token: raw });
        if (!cancelled) {
          setStatus("verified");
          forgetPendingVerificationEmail();
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(resolveVerificationFailure(error));
        }
      } finally {
        // Le jeton ne doit pas rester dans la barre d'adresse : il partirait
        // dans l'historique, les favoris et l'en-tete `Referer`. `replace`
        // plutot que `push` pour qu'un retour arriere ne le ramene pas.
        if (!cancelled) {
          router.replace("/login/verify-email");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, router, token]);

  const view = buildEmailVerificationView(status);

  async function handleResend(event: FormEvent) {
    event.preventDefault();
    const validation = validateResendVerificationEmail(email);
    if (!validation.valid) {
      setValidationMessage(validation.message);
      return;
    }

    setValidationMessage(null);
    setIsResending(true);
    try {
      await client.resendVerification(buildResendVerificationPayload(email));
    } catch {
      // Volontairement silencieux : distinguer un succes d'un echec ici
      // revelerait l'existence du compte. Le backend repond deja de maniere
      // uniforme, l'interface ne doit pas defaire cette garantie.
    } finally {
      setResendMessage(VERIFY_EMAIL_RESEND_DONE);
      setIsResending(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F4F5F7] px-4 py-12">
      <div
        data-verify-state={view.status}
        className="w-full max-w-md rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-4 flex justify-center">
          <YunicityLogo size="lg" />
        </div>

        <div className="mb-4 flex justify-center" aria-hidden>
          {view.status === "checking" ? (
            <Loader2 className="h-8 w-8 animate-spin text-yunicity-primary motion-reduce:animate-none" />
          ) : view.status === "verified" ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          ) : (
            <Mail className="h-8 w-8 text-neutral-400" />
          )}
        </div>

        <h1 className="text-center text-xl font-bold text-neutral-900 sm:text-2xl">{view.title}</h1>
        <p
          className="mt-3 whitespace-pre-line text-center text-sm leading-relaxed text-neutral-600"
          role={view.status === "checking" ? "status" : undefined}
          aria-live={view.status === "checking" ? "polite" : undefined}
        >
          {view.body}
        </p>

        {view.status === "pending" ? (
          <p className="mt-3 text-center text-xs leading-relaxed text-neutral-500">
            {VERIFY_EMAIL_PENDING_HINT}
          </p>
        ) : null}

        {view.showLoginCta ? (
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="mt-6 min-h-11 w-full rounded-xl bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            {VERIFY_EMAIL_LOGIN_CTA}
          </button>
        ) : null}

        {view.canResend ? (
          <VerifyEmailResendForm
            email={email}
            onEmailChange={setEmail}
            onSubmit={(event) => void handleResend(event)}
            isSubmitting={isResending}
            validationMessage={validationMessage}
            resultMessage={resendMessage}
          />
        ) : null}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-semibold text-yunicity-primary hover:underline">
            {VERIFY_EMAIL_LOGIN_LINK}
          </Link>
        </div>
      </div>
    </main>
  );
}
