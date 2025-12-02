import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

export type AuthPayload = {
  userId?: string | number
  email?: string
  role?: string
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim()
  }

  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function verifyJwtFromRequest(request: Request): AuthPayload | null {
  const token = getTokenFromRequest(request)
  if (!token || !JWT_SECRET) return null
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload
  } catch {
    return null
  }
}

export function requireAdminFromRequest(request: Request): AuthPayload | null {
  const payload = verifyJwtFromRequest(request)
  if (payload?.role !== 'admin') return null
  return payload
}
