import { CreateHubProvider } from "@/components/create-hub";
import { ExplorerProvider } from "@/components/explorer";
import { NavigationOverlayCoordinatorProvider } from "@/components/navigation/navigation-overlay-coordinator";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { SITE_DEFAULT_METADATA } from "@/lib/seo/metadata";
import { getDefaultOgImageUrl, getSiteUrl } from "@/lib/seo/site";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { YUNICITY_MASCOT_PATH } from "@yunicity/utils";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_DEFAULT_METADATA.defaultTitle,
    template: `%s | ${SITE_DEFAULT_METADATA.siteName}`,
  },
  description: SITE_DEFAULT_METADATA.defaultDescription,
  applicationName: SITE_DEFAULT_METADATA.siteName,
  keywords: [...SITE_DEFAULT_METADATA.keywords],
  icons: {
    icon: YUNICITY_MASCOT_PATH,
    apple: YUNICITY_MASCOT_PATH,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_DEFAULT_METADATA.siteName,
    title: SITE_DEFAULT_METADATA.defaultTitle,
    description: SITE_DEFAULT_METADATA.defaultDescription,
    images: [{ url: getDefaultOgImageUrl(), alt: SITE_DEFAULT_METADATA.siteName }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_DEFAULT_METADATA.defaultTitle,
    description: SITE_DEFAULT_METADATA.defaultDescription,
    images: [getDefaultOgImageUrl()],
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
        <AuthProvider>
          <NavigationOverlayCoordinatorProvider>
            <ExplorerProvider>
              <CreateHubProvider>{children}</CreateHubProvider>
            </ExplorerProvider>
          </NavigationOverlayCoordinatorProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
