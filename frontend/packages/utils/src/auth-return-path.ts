/** Default post-auth destination when `next` is missing or unsafe (REC-01). */
export const DEFAULT_AUTH_REDIRECT = "/feed";

const PROTOCOL_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const ENCODED_PROTOCOL_RELATIVE_PATTERN = /%2f%2f/i;

/**
 * Returns true when `value` is a safe in-app relative path for post-login redirect.
 * Rejects external URLs, protocol-relative paths, and scheme-based payloads.
 */
export function isSafeInternalReturnPath(value: string | null | undefined): boolean {
  if (value == null) {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (!trimmed.startsWith("/")) {
    return false;
  }

  if (trimmed.startsWith("//")) {
    return false;
  }

  if (PROTOCOL_PATTERN.test(trimmed)) {
    return false;
  }

  if (trimmed.includes("\\")) {
    return false;
  }

  if (ENCODED_PROTOCOL_RELATIVE_PATTERN.test(trimmed)) {
    return false;
  }

  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded.startsWith("//") || PROTOCOL_PATTERN.test(decoded)) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

/** Resolve a validated post-login path, falling back when `next` is unsafe. */
export function resolveAuthReturnPath(
  value: string | null | undefined,
  fallback: string = DEFAULT_AUTH_REDIRECT,
): string {
  if (!isSafeInternalReturnPath(value)) {
    return fallback;
  }
  return value!.trim();
}

/** Build `/login?next=…` for redirecting unauthenticated users. */
export function buildLoginUrlWithNext(returnPath: string): string {
  const params = new URLSearchParams();
  params.set("next", returnPath);
  return `/login?${params.toString()}`;
}

/** Combine pathname and query string from the current route. */
export function buildCurrentAppPath(pathname: string, search: string): string {
  const normalizedPath = pathname.trim() || DEFAULT_AUTH_REDIRECT;
  const normalizedSearch = search.trim();
  if (!normalizedSearch) {
    return normalizedPath;
  }
  return `${normalizedPath}?${normalizedSearch}`;
}
