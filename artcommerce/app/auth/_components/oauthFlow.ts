// File: app/auth/_components/oauthFlow.ts
//
// Persists "an OAuth sign-in is in flight" across the full-page redirect that
// some providers do on mobile. Without this, the login page remounts after the
// redirect with no memory of the in-flight flow and renders a fresh-looking
// form while Firebase silently resolves the redirect in the background.

export type OAuthProvider = "google" | "facebook"

const STORAGE_KEY = "kalakraft:oauth-flow"

interface OAuthFlowState {
  provider: OAuthProvider
  startedAt: number
}

// If a stored flow is older than this, treat it as stale (user navigated away
// from the Google page or abandoned the flow). 5 minutes is a generous ceiling
// for an interactive redirect.
const STALE_AFTER_MS = 5 * 60 * 1000

function isBrowser() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined"
}

export function beginOAuthFlow(provider: OAuthProvider) {
  if (!isBrowser()) return
  const state: OAuthFlowState = { provider, startedAt: Date.now() }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota / private-mode errors
  }
}

export function readOAuthFlow(): OAuthProvider | null {
  if (!isBrowser()) return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OAuthFlowState
    if (!parsed?.provider) return null
    if (parsed.provider !== "google" && parsed.provider !== "facebook") {
      return null
    }
    if (
      typeof parsed.startedAt === "number" &&
      Date.now() - parsed.startedAt > STALE_AFTER_MS
    ) {
      clearOAuthFlow()
      return null
    }
    return parsed.provider
  } catch {
    return null
  }
}

export function clearOAuthFlow() {
  if (!isBrowser()) return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
