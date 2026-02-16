import {
  getTokenFromRequest as getTokenFromRequestStrict,
  verifyAccessToken,
} from './session-auth'

export type AuthContext = {
  userId: string
  email?: string
  role?: string
}

function getTokenFromRequest(request: Request): string | null {
  return getTokenFromRequestStrict(request)
}

export function getAuthContext(request: Request): AuthContext | null {
  const token = getTokenFromRequest(request)
  if (!token) return null
  const payload = verifyAccessToken(token)
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
