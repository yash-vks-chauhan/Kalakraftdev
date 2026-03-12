import { getAuthenticatedUser, requireAdminUser } from './session-auth'

export type AuthContext = {
  userId: string
  email?: string
  role?: string
}

export async function getAuthContext(request: Request): Promise<AuthContext | null> {
  const user = await getAuthenticatedUser(request)
  if (!user?.id) {
    return null
  }
  return {
    userId: String(user.id),
    email: user.email || undefined,
    role: user.role || undefined,
  }
}

export async function requireAdmin(request: Request): Promise<AuthContext | null> {
  const admin = await requireAdminUser(request)
  if (!admin?.id) return null
  return {
    userId: admin.id,
    email: admin.email || undefined,
    role: admin.role || undefined,
  }
}
