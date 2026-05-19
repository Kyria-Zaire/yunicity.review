import { WebContextPanel } from "@/components/layout/web-context-panel";
import Link from "next/link";

export function ProfilePageAside() {
  return (
    <>
    <WebContextPanel title="Conseils profil">
      <p>
        Un nom affiché clair et une bio courte aident les autres membres à te reconnaître dans
        ton quartier.
      </p>
      <p>
        Choisis des intérêts qui reflètent vraiment ce que tu vis à Reims — ils servent à te
        connecter localement.
      </p>
    </WebContextPanel>
    <WebContextPanel title="Visibilité">
      <p>
        <strong className="text-neutral-800">Public</strong> — profil visible par la communauté.
      </p>
      <p>
        <strong className="text-neutral-800">Amis</strong> — réservé aux connexions acceptées
        (bientôt).
      </p>
      <p>
        <strong className="text-neutral-800">Privé</strong> — seul toi vois les détails sensibles.
      </p>
    </WebContextPanel>
    <WebContextPanel title="Actions rapides">
      <Link
        href="/passport"
        className="block font-medium text-neutral-900 underline-offset-2 hover:underline"
      >
        Ouvrir mon Passport
      </Link>
      <Link
        href="/organizations/me"
        className="block font-medium text-neutral-900 underline-offset-2 hover:underline"
      >
        Mes lieux
      </Link>
    </WebContextPanel>
    </>
  );
}

export function OrganizationsMeAside() {
  return (
    <>
      <WebContextPanel title="Tes lieux sur Yunicity">
        <p>
          Chaque lieu que tu représentes reste lié à ton compte. La vérification garantit la
          confiance du réseau local.
        </p>
        <p>
          Tant qu&apos;un lieu est en attente ou privé, il n&apos;apparaît pas publiquement sur la
          carte.
        </p>
      </WebContextPanel>
      <WebContextPanel title="Proposer un lieu">
        <p>
          Commerce, association, tiers-lieu… Si tu es responsable ou mandaté, tu peux soumettre une
          fiche en quelques minutes.
        </p>
        <Link
          href="/organizations/request"
          className="inline-block rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          Créer une demande
        </Link>
      </WebContextPanel>
    </>
  );
}

export function OrganizationRequestAside() {
  return (
    <>
      <WebContextPanel title="Pourquoi proposer un lieu ?">
        <p>
          Yunicity met en avant les acteurs qui font vivre Reims : événements, offres Passport,
          présence sur la carte locale.
        </p>
        <p>
          Une fiche vérifiée rassure les citoyens et évite les adresses fantômes.
        </p>
      </WebContextPanel>
      <WebContextPanel title="Validation Yunicity">
        <p>
          Chaque demande est relue par l&apos;équipe. On vérifie la cohérence du lieu et ton lien
          avec l&apos;établissement.
        </p>
        <p className="text-neutral-500">
          Pas de publication automatique : ton lieu reste privé jusqu&apos;à validation.
        </p>
      </WebContextPanel>
    </>
  );
}

export function PassportTipsAside() {
  return (
    <WebContextPanel title="Dans la ville">
      <p>
        Présente ton QR Passport chez les partenaires pour collecter des tampons et débloquer des
        offres locales.
      </p>
      <p className="text-neutral-500">
        Le scan mobile arrive bientôt — garde ton passeport actif sur ton téléphone.
      </p>
    </WebContextPanel>
  );
}
