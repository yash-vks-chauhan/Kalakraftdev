import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export interface AuthPayload {
  userId: number
  email?: string
  role: string
}

// Extract JWT from Authorization header (Bearer) or httpOnly cookie "token"
export function getAuthFromRequest(req: Request): AuthPayload | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || ''
  let token = ''
  if (authHeader.startsWith('Bearer ')) token = authHeader.substring(7)
  if (!token) {
    const cookie = req.headers.get('cookie') || ''
    const match = cookie.match(/(?:^|;\s*)token=([^;]+)/)
    if (match) token = decodeURIComponent(match[1])
  }
  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    return { userId: Number(payload.userId), email: payload.email, role: payload.role }
  } catch {
    return null
  }
}

export function requireAdmin(req: Request): AuthPayload | null {
  const auth = getAuthFromRequest(req)
  if (!auth || auth.role !== 'admin') return null
  return auth
}

