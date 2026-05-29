const DEFAULT_PUBLIC_APP_URL = 'https://kalakraftdev.vercel.app'

export function getPublicAppUrl(): string {
  for (const candidate of [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    DEFAULT_PUBLIC_APP_URL,
  ]) {
    const value = candidate?.trim()
    if (!value) continue

    try {
      return new URL(value).origin
    } catch {
      // Ignore malformed environment values and try the next configured URL.
    }
  }

  return DEFAULT_PUBLIC_APP_URL
}

export function getPublicAppUrlForPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getPublicAppUrl()}${normalizedPath}`
}
