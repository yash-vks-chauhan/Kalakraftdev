import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export type AuthContext = {
  userId: string
  email?: string
  role?: string
}

function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || ''
  const bearerToken = authHeader.replace(/Bearer\s+/i, '').trim()
  if (bearerToken) return bearerToken

  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/(?:^|;)\s*token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function getAuthContext(request: Request): AuthContext | null {
  const token = getTokenFromRequest(request)
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET) as AuthContext
  } catch {
    return null
  }
}

export function requireAdmin(request: Request): AuthContext | null {
  const ctx = getAuthContext(request)
  if (!ctx || ctx.role !== 'admin') return null
  return ctx
}
