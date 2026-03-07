import { verifyRequestAccessToken } from './session-auth'

export type AuthContext = {
  userId: string
  email?: string
  role?: string
}

export function getAuthContext(request: Request): AuthContext | null {
  const payload = verifyRequestAccessToken(request)
  if (!payload?.userId) {
    return null
  }
  return {
    userId: String(payload.userId),
    email: payload.email || undefined,
    role: payload.role || undefined,
  }
}

export function requireAdmin(request: Request): AuthContext | null {
  const ctx = getAuthContext(request)
  if (!ctx || ctx.role !== 'admin') return null
  return ctx
}
