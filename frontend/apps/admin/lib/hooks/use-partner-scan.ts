"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type {
  ScanPassportPreview,
  ScanRedeemableOffer,
  ScanRedeemResponse,
} from "@yunicity/types";
import {
  buildPartnerScanKpiCards,
  buildPartnerScanNextAction,
  buildPartnerScanSignal,
  derivePartnerScanPhase,
  humanizeScanError,
  isAuthError,
} from "@yunicity/utils";
import { useCallback, useMemo, useState } from "react";

export function usePartnerScan() {
  const { scanApi } = useAuth();
  const [code, setCode] = useState("");
  const [qrSecret, setQrSecret] = useState("");
  const [passport, setPassport] = useState<ScanPassportPreview | null>(null);
  const [offers, setOffers] = useState<ScanRedeemableOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [redeemResult, setRedeemResult] = useState<ScanRedeemResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [lastValidationAt, setLastValidationAt] = useState<string | null>(null);

  const phase = derivePartnerScanPhase({
    isResolving,
    passportResolved: passport !== null && redeemResult === null,
    redeemSuccess: redeemResult !== null,
    hasBlockingError: error !== null && passport === null,
  });

  const redeemableOffers = useMemo(
    () => offers.filter((offer) => !offer.already_redeemed),
    [offers],
  );

  const canRedeem = Boolean(selectedOfferId && redeemableOffers.some((o) => o.id === selectedOfferId));

  const reset = useCallback(() => {
    setCode("");
    setQrSecret("");
    setPassport(null);
    setOffers([]);
    setSelectedOfferId(null);
    setRedeemResult(null);
    setError(null);
    setErrorCode(null);
    setIsResolving(false);
    setIsRedeeming(false);
  }, []);

  const resolveCode = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      return;
    }

    setIsResolving(true);
    setError(null);
    setErrorCode(null);
    setRedeemResult(null);
    setPassport(null);
    setOffers([]);
    setSelectedOfferId(null);

    try {
      const data = await scanApi.resolvePassport({ qr_secret: trimmed });
      setQrSecret(trimmed);
      setPassport(data.passport);
      const available = data.offers.filter((offer) => !offer.already_redeemed);
      setOffers(data.offers);
      setSelectedOfferId(available.length === 1 ? (available[0]?.id ?? null) : null);
    } catch (err) {
      setPassport(null);
      setOffers([]);
      if (isAuthError(err)) {
        setError(humanizeScanError(err.code, err.message));
        setErrorCode(err.code ?? null);
      } else {
        setError("Impossible de rechercher ce Passport pour le moment.");
        setErrorCode(null);
      }
    } finally {
      setIsResolving(false);
    }
  }, [code, scanApi]);

  const redeemSelected = useCallback(async () => {
    if (!selectedOfferId || !qrSecret) {
      return;
    }

    setIsRedeeming(true);
    setError(null);
    setErrorCode(null);

    try {
      const result = await scanApi.redeemOffer({
        offer_id: selectedOfferId,
        qr_secret: qrSecret,
      });
      setRedeemResult(result);
      setLastValidationAt(new Date().toISOString());
      setOffers((prev) => prev.filter((offer) => offer.id !== selectedOfferId));
      setSelectedOfferId(null);
    } catch (err) {
      if (isAuthError(err)) {
        setError(humanizeScanError(err.code, err.message));
        setErrorCode(err.code ?? null);
      } else {
        setError("Impossible de valider cette interaction pour le moment.");
        setErrorCode(null);
      }
    } finally {
      setIsRedeeming(false);
    }
  }, [qrSecret, scanApi, selectedOfferId]);

  const retry = useCallback(() => {
    setError(null);
    setErrorCode(null);
    if (passport) {
      void redeemSelected();
      return;
    }
    void resolveCode();
  }, [passport, redeemSelected, resolveCode]);

  return useMemo(
    () => ({
      code,
      setCode,
      passport,
      offers: redeemableOffers,
      allOffers: offers,
      selectedOfferId,
      setSelectedOfferId,
      redeemResult,
      error,
      errorCode,
      isResolving,
      isRedeeming,
      isBusy: isResolving || isRedeeming,
      phase,
      signal: buildPartnerScanSignal(phase, error),
      nextAction: buildPartnerScanNextAction(phase, canRedeem),
      kpiCards: buildPartnerScanKpiCards({
        phase,
        inputMode: "manual",
        lastValidationAt,
      }),
      canRedeem,
      resolveCode,
      redeemSelected,
      reset,
      retry,
    }),
    [
      canRedeem,
      code,
      error,
      errorCode,
      isRedeeming,
      isResolving,
      lastValidationAt,
      offers,
      passport,
      phase,
      redeemResult,
      redeemSelected,
      redeemableOffers,
      reset,
      resolveCode,
      retry,
      selectedOfferId,
    ],
  );
}
