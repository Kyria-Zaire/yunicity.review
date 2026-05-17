import type { Metadata } from "next";
import { AdminShell } from "@/components/admin-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yunicity Admin",
  description: "Back-office Yunicity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
