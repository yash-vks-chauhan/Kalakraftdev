import { firebaseAdmin } from './firebase-admin'
import { getTokenFromRequest, verifyJwtFromRequest } from './auth-helpers'

export type SupportAuth = {
  userId?: string
  email?: string
  role?: string
}

export async function getSupportAuth(request: Request): Promise<SupportAuth | null> {
  const jwtPayload = verifyJwtFromRequest(request)
  if (jwtPayload?.email) {
    return {
      userId: jwtPayload.userId ? String(jwtPayload.userId) : undefined,
      email: jwtPayload.email,
      role: jwtPayload.role,
    }
  }

  const token = getTokenFromRequest(request)
  if (token) {
    try {
      const decoded = await firebaseAdmin.auth().verifyIdToken(token)
      return {
        userId: decoded.uid,
        email: decoded.email,
        role: (decoded as any).role,
      }
    } catch {
      // ignored
    }
  }
  return null
}
