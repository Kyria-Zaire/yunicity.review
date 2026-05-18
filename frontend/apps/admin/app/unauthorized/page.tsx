import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Accès refusé</h1>
      <p className="text-sm text-muted-foreground">
        L&apos;admin Yunicity nécessite <strong>moderation.manage</strong> ou{" "}
        <strong>system.admin</strong>. Votre compte n&apos;a pas ces droits.
      </p>
      <div className="flex gap-4 text-sm">
        <Link href="/login" className="font-medium text-neutral-900 hover:underline">
          Connexion
        </Link>
        <Link href="/" className="text-muted-foreground hover:underline">
          Accueil
        </Link>
      </div>
    </main>
  );
}
