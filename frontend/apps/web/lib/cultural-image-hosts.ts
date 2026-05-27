/** Hostnames autorisés pour next/image (aligné sur next.config.ts). */

export const CULTURAL_IMAGE_REMOTE_HOSTS = [
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  "images.unsplash.com",
  "plus.unsplash.com",
  "res.cloudinary.com",
  "th.bing.com",
  "www.actualitix.com",
  "img-4.linternaute.com",
  "cdn.elebase.io",
] as const;

export function isAllowedCulturalImageHost(src: string): boolean {
  try {
    const { hostname } = new URL(src);
    return CULTURAL_IMAGE_REMOTE_HOSTS.some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
    );
  } catch {
    return false;
  }
}

export function culturalImageRemotePatterns() {
  return CULTURAL_IMAGE_REMOTE_HOSTS.map((hostname) => ({
    protocol: "https" as const,
    hostname,
    pathname: "/**",
  }));
}
