"use client";

import type { PassportWalletResponse } from "@yunicity/types";
import { getWalletContextMessage } from "@yunicity/utils";

type PassportWalletCardProps = {
  wallet: PassportWalletResponse;
};

export function PassportWalletCard({ wallet }: PassportWalletCardProps) {
  const contextMessage = getWalletContextMessage(wallet);

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-yunicity-primary">YuniMonnaie</p>
      <h2 className="mt-2 text-xl font-bold text-neutral-900">Ton portefeuille local</h2>
      <p className="mt-4 text-4xl font-bold tabular-nums text-neutral-900">
        {wallet.balance.toLocaleString("fr-FR")}{" "}
        <span className="text-lg font-semibold text-neutral-500">YM disponibles</span>
      </p>
      <p className="mt-3 text-sm leading-relaxed text-neutral-600">{contextMessage}</p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-neutral-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">Total gagné</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-neutral-900">
            {wallet.lifetime_earned.toLocaleString("fr-FR")} YM
          </dd>
        </div>
        <div className="rounded-xl bg-neutral-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">Total dépensé</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-neutral-900">
            {wallet.lifetime_spent.toLocaleString("fr-FR")} YM
          </dd>
        </div>
      </dl>
      <p className="mt-5 text-sm leading-relaxed text-neutral-600">
        La YuniMonnaie récompense ton engagement local. Elle n&apos;est ni transférable ni convertible en
        euros.
      </p>
    </section>
  );
}
