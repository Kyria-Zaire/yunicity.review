"use client";

import { YunicityLogo } from "@/components/brand";
import { RegisterDesktopScreen } from "@/components/register/desktop";
import { RegisterMediumScreen } from "@/components/register/medium";
import { RegisterMobileScreen } from "@/components/register/mobile";
import { RegisterPortalFooter } from "@/components/register/shared/register-portal-footer";
import { TurnstileWidget } from "@/components/register/turnstile-widget";
import { useRegisterWizard } from "@/hooks/use-register-wizard";
import { useRegistrationStatus } from "@/hooks/use-registration-status";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  buildRegisterApiPayload,
  buildRegisterPostAuthPath,
  isCitizenRegisterAccountType,
  isRegistrationFormUsable,
  shouldRenderTurnstile,
  validateRegisterStep,
  REGISTER_CLOSED_BODY,
  REGISTER_TURNSTILE_REQUIRED,
  REGISTER_CLOSED_TITLE,
  REGISTER_SUCCESS_CITIZEN_BODY,
  REGISTER_SUCCESS_CTA_FEED,
  REGISTER_SUCCESS_CTA_ORG,
  REGISTER_SUCCESS_ORG_BODY,
  REGISTER_SUCCESS_TITLE,
} from "@yunicity/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";

export function RegisterScreen() {
  return (
    <Suspense fallback={null}>
      <RegisterScreenInner />
    </Suspense>
  );
}

function RegisterScreenInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, error, clearError } = useAuth();
  const wizard = useRegisterWizard();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successPath, setSuccessPath] = useState<string | null>(null);
  const [submitValidationMessage, setSubmitValidationMessage] = useState<string | null>(null);

  const { status: registrationStatus } = useRegistrationStatus();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileUnavailable, setTurnstileUnavailable] = useState(false);
  // Change de valeur pour forcer un widget neuf : un jeton Turnstile est a usage
  // unique, donc apres une soumission refusee il faut en redemander un.
  const [turnstileCycle, setTurnstileCycle] = useState(0);

  const turnstileVisible = shouldRenderTurnstile(registrationStatus);
  const handleTurnstileToken = useCallback((token: string | null) => {
    setTurnstileToken(token);
    if (token) setTurnstileUnavailable(false);
  }, []);
  const handleTurnstileUnavailable = useCallback(() => {
    setTurnstileToken(null);
    setTurnstileUnavailable(true);
  }, []);

  const loginHref = useMemo(() => {
    const next = searchParams.get("next");
    if (!next || !next.startsWith("/")) return "/login";
    return `/login?next=${encodeURIComponent(next)}`;
  }, [searchParams]);

  async function handleSubmit() {
    const validation = validateRegisterStep("finish", wizard.draft);
    if (!validation.valid) {
      setSubmitValidationMessage(validation.message);
      return;
    }
    if (turnstileVisible && !turnstileToken) {
      // Les champs saisis restent intacts : on demande seulement la verification.
      setSubmitValidationMessage(REGISTER_TURNSTILE_REQUIRED);
      return;
    }
    setSubmitValidationMessage(null);

    clearError();
    setIsSubmitting(true);
    try {
      const outcome = await register({
        ...buildRegisterApiPayload(wizard.draft),
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      });
      if (outcome.status === "verification_required") {
        // Le compte est cree ; la session attend la confirmation de l'adresse.
        // `replace` pour qu'un retour arriere ne repropose pas l'assistant.
        const path = "/login/verify-email";
        router.replace(path);
        setSuccessPath(path);
        return;
      }
      if (outcome.status === "authenticated") {
        const path = buildRegisterPostAuthPath(wizard.draft.accountType);
        router.replace(path);
        setSuccessPath(path);
      }
    } finally {
      setIsSubmitting(false);
      if (turnstileVisible) {
        // Consomme ou refuse, le jeton ne resservira pas : on remonte un widget
        // neuf sans toucher aux champs deja saisis.
        setTurnstileToken(null);
        setTurnstileCycle((cycle) => cycle + 1);
      }
    }
  }

  const wizardProps = {
    wizard,
    error,
    submitValidationMessage,
    isSubmitting,
    onSubmit: () => void handleSubmit(),
    loginHref,
  };

  // REGISTRATION-CONTAINMENT-01 — beta fermee. On ne fait pas remplir quatre
  // etapes d'assistant pour finir sur un 403 : l'etat est annonce d'emblee.
  // Ceci ne PROTEGE rien, la seule barriere est le backend ; c'est de
  // l'honnetete d'interface. Le pied de page existant porte deja le lien de
  // connexion (avec son `next` filtre) et les mentions legales.
  if (!isRegistrationFormUsable(registrationStatus)) {
    return (
      <main className="flex min-h-dvh items-center bg-[#F4F5F7] px-4 py-8">
        <div
          data-register-state="closed"
          className="mx-auto w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm sm:p-8"
        >
          <div className="mb-4 flex justify-center">
            <YunicityLogo size="lg" />
          </div>
          <h1 className="text-lg font-bold text-neutral-900 sm:text-xl">{REGISTER_CLOSED_TITLE}</h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">{REGISTER_CLOSED_BODY}</p>
          <RegisterPortalFooter loginHref={loginHref} variant="compact" />
        </div>
      </main>
    );
  }

  if (successPath) {
    const isCitizen = isCitizenRegisterAccountType(wizard.draft.accountType);
    return (
      <main className="flex min-h-dvh items-center bg-[#F4F5F7] px-4 py-8">
        <div className="mx-auto w-full max-w-lg rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mb-4 flex justify-center">
            <YunicityLogo size="lg" />
          </div>
          <p className="text-lg font-bold text-emerald-900 sm:text-xl">{REGISTER_SUCCESS_TITLE}</p>
          <p className="mt-3 text-sm leading-relaxed text-emerald-800">
            {isCitizen ? REGISTER_SUCCESS_CITIZEN_BODY : REGISTER_SUCCESS_ORG_BODY}
          </p>
          <Link
            href={successPath}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-yunicity-primary px-6 py-3 text-sm font-semibold text-white sm:w-auto sm:py-2.5"
          >
            {isCitizen ? REGISTER_SUCCESS_CTA_FEED : REGISTER_SUCCESS_CTA_ORG}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <RegisterMobileScreen {...wizardProps} />
      <RegisterMediumScreen {...wizardProps} />
      <RegisterDesktopScreen {...wizardProps} />

      {/* Rendu UNE fois pour les trois points de rupture, comme la banniere des
          reglages : monter un widget par vue en empilerait trois, et Cloudflare
          n'en attend qu'un par page. Le conteneur reprend la largeur mesuree de
          l'assistant pour rester aligne a 390, 900 et 1440. */}
      {turnstileVisible && registrationStatus.turnstile_site_key ? (
        <div
          data-testid="register-turnstile"
          className="mx-auto w-full max-w-lg px-4 pb-8 sm:px-0"
        >
          <TurnstileWidget
            key={turnstileCycle}
            siteKey={registrationStatus.turnstile_site_key}
            onToken={handleTurnstileToken}
            onUnavailable={handleTurnstileUnavailable}
          />
          {turnstileUnavailable ? null : (
            <p className="sr-only" role="status" aria-live="polite">
              {turnstileToken
                ? "Vérification de sécurité validée."
                : "Vérification de sécurité requise avant de continuer."}
            </p>
          )}
        </div>
      ) : null}
    </main>
  );
}
