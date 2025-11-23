const UNSAFE_PROTOCOL_REGEX = /^(javascript:|data:)/i;
const HAS_SCHEME_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
const HTTP_PROTOCOL_REGEX = /^https?:\/\//i;

/**
 * Normalizes action URLs received from notifications so they can be safely rendered.
 * - Trims whitespace
 * - Rejects javascript/data protocols
 * - Ensures relative paths start with a single leading slash
 */
export function normalizeActionUrl(actionUrl?: string): string | null {
  if (!actionUrl) {
    return null;
  }

  const trimmed = actionUrl.trim();

  if (!trimmed || UNSAFE_PROTOCOL_REGEX.test(trimmed)) {
    return null;
  }

  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    HAS_SCHEME_REGEX.test(trimmed)
  ) {
    return trimmed;
  }

  // Treat bare paths as app-relative routes.
  return `/${trimmed.replace(/^\/+/, '')}`;
}

export function isInternalActionUrl(actionUrl: string): boolean {
  return actionUrl.startsWith('/') || actionUrl.startsWith('#');
}

export function shouldOpenInNewTab(actionUrl: string): boolean {
  return HTTP_PROTOCOL_REGEX.test(actionUrl);
}

