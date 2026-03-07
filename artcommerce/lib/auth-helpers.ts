import {
  getBearerTokenFromRequest,
  verifyRequestAccessToken,
} from './session-auth'

export type AuthPayload = {
  userId?: string | number
  email?: string
  role?: string
}

export function getTokenFromRequest(request: Request): string | null {
  return getBearerTokenFromRequest(request)
}

export function verifyJwtFromRequest(request: Request): AuthPayload | null {
  const payload = verifyRequestAccessToken(request)
  if (!payload?.userId) {
    return null
  }
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  }
}

export function requireAdminFromRequest(request: Request): AuthPayload | null {
  const payload = verifyJwtFromRequest(request)
  if (payload?.role !== 'admin') return null
  return payload
}
