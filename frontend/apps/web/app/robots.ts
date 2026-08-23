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
        "/dev",
        "/dev/",
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
