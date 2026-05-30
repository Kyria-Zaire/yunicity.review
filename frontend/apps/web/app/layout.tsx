import { AuthProvider } from "@/lib/auth/auth-provider";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { YUNICITY_MASCOT_PATH } from "@yunicity/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yunicity",
  description: "Réseau social local-first — Reims",
  icons: {
    icon: YUNICITY_MASCOT_PATH,
    apple: YUNICITY_MASCOT_PATH,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
