const allowedOriginEnvs = [process.env.NEXT_PUBLIC_APP_URL, process.env.APP_URL].filter(Boolean) as string[];

/**
 * Basic origin/referrer check to reduce CSRF risk for cookie-authenticated requests.
 * Allows:
 *   - Same host as the request URL
 *   - Hosts that match NEXT_PUBLIC_APP_URL or APP_URL (if set)
 */
export function isAllowedOrigin(request: Request): boolean {
  const originHeader = request.headers.get('origin') || request.headers.get('referer');
  if (!originHeader) return true; // allow non-browser or headerless clients

  let originHost: string;
  try {
    originHost = new URL(originHeader).host;
  } catch {
    return false;
  }

  const requestHost = new URL(request.url).host;
  if (originHost === requestHost) return true;

  for (const allowed of allowedOriginEnvs) {
    try {
      if (new URL(allowed).host === originHost) {
        return true;
      }
    } catch {
      // ignore malformed env URLs
    }
  }

  return false;
}
