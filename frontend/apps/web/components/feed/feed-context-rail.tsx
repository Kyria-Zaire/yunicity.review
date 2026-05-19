import { WebContextPanel } from "@/components/layout/web-context-panel";
import Link from "next/link";

export function FeedContextRail({ city }: { city?: string | null }) {
  return (
    <>
      <WebContextPanel title="Votre ville">
        <p>
          {city
            ? `Le fil met en avant ce qui se passe à ${city}, puis le reste de la communauté Yunicity.`
            : "Complétez votre ville dans le profil pour un fil plus pertinent."}
        </p>
        <Link href="/profile/me" className="font-medium text-yunicity-primary hover:underline">
          Mon profil
        </Link>
      </WebContextPanel>
      <WebContextPanel title="Activité locale">
        <p>
          Les offres Passport de vos commerces partenaires apparaissent ici lorsqu’elles sont
          publiées — des avantages utiles, pas de la publicité.
        </p>
        <Link href="/passport" className="font-medium text-yunicity-primary hover:underline">
          Mon Passport
        </Link>
      </WebContextPanel>
      <WebContextPanel title="Règles de communauté">
        <p>
          Partagez avec bienveillance. Signalez les contenus inappropriés. La modération Yunicity
          traite les signalements manuellement.
        </p>
      </WebContextPanel>
      <WebContextPanel title="Découvrir Yunicity">
        <p>
          Proposez un lieu, explorez le Passport et reconnectez-vous à votre ville sans le bruit
          des réseaux globaux.
        </p>
        <Link
          href="/organizations/request"
          className="font-medium text-yunicity-primary hover:underline"
        >
          Proposer un lieu
        </Link>
      </WebContextPanel>
    </>
  );
}
