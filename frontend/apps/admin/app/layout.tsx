import { AuthProvider } from "@/lib/auth/auth-provider";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { YUNICITY_MASCOT_PATH } from "@yunicity/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yunicity Admin",
  description: "Back-office Yunicity",
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
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
