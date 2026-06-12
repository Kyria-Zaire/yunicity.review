import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/register",
        "/feed",
        "/search",
        "/profile/me",
        "/notifications",
        "/settings",
        "/passport",
        "/discussions",
        "/organizations/",
        "/protected",
        "/stories",
        "/subscriptions",
        "/tribes",
        "/map",
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
