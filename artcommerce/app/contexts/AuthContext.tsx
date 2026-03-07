'use client'

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { signOut as firebaseSignOut } from 'firebase/auth'
import { auth as firebaseAuth } from '../firebase/client'
import { SESSION_AUTH_MARKER } from '../../lib/auth-session-marker'

export interface Order {
  id: number
  createdAt: string
  totalAmount: number
  status: string
}

export interface User {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  defaultAddressId?: number
  role: 'user' | 'admin'
  orders?: Order[]
}

interface AuthContextValue {
  user: User | null
  token: string | null
  signup: (fullName: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchProfile: (token?: string | null) => Promise<void>
  loading: boolean
  loginWithFirebaseToken: (idToken: string) => Promise<void>
  refreshToken: () => Promise<string | null>
  error: string | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const LOGOUT_IN_PROGRESS_KEY = 'artcommerce:logout_in_progress'

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clearAuthState = useCallback(() => {
    setToken(null)
    setUser(null)
    setError(null)
  }, [])

  const markSessionAuthenticated = useCallback(() => {
    setToken(SESSION_AUTH_MARKER)
  }, [])

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (!res.ok) {
        clearAuthState()
        return null
      }

      markSessionAuthenticated()
      return SESSION_AUTH_MARKER
    } catch (err) {
      console.error('Failed to refresh token:', err)
      clearAuthState()
      return null
    }
  }, [clearAuthState, markSessionAuthenticated])

  const fetchProfile = useCallback(
    async (_currentToken?: string | null) => {
      setLoading(true)

      try {
        const requestProfile = () =>
          fetch('/api/auth/me', {
            credentials: 'include',
          })

        let res = await requestProfile()

        if (res.status === 401) {
          const refreshed = await refreshToken()
          if (!refreshed) {
            return
          }
          res = await requestProfile()
        }

        if (!res.ok) {
          clearAuthState()
          return
        }

        const data = await res.json().catch(() => ({}))
        if (!data.user) {
          clearAuthState()
          return
        }

        markSessionAuthenticated()
        setUser(data.user)
      } catch (err) {
        console.error('Fetch profile error:', err)
        clearAuthState()
      } finally {
        setLoading(false)
      }
    },
    [refreshToken, clearAuthState, markSessionAuthenticated]
  )

  const logout = useCallback(async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(LOGOUT_IN_PROGRESS_KEY, '1')
    }

    try {
      // Clear Firebase client auth first to prevent immediate auto sign-in.
      if (firebaseAuth?.currentUser) {
        await firebaseSignOut(firebaseAuth)
      }

      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      clearAuthState()
      setLoading(false)
      router.replace('/auth/login')
    }
  }, [clearAuthState, router])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false)
    }, 12000)

    fetchProfile(null).finally(() => clearTimeout(timeoutId))
    return () => clearTimeout(timeoutId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signup = useCallback(
    async (fullName: string, email: string, password: string) => {
      setLoading(true)
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, password }),
          credentials: 'include',
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Signup failed')

        markSessionAuthenticated()
        await fetchProfile(SESSION_AUTH_MARKER)
        router.replace('/')
      } finally {
        setLoading(false)
      }
    },
    [router, fetchProfile, markSessionAuthenticated]
  )

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        clearAuthState()
        if (res.status === 401) {
          throw new Error('The email or password you entered is incorrect')
        }
        throw new Error(data.error || 'Login failed. Please try again')
      }

      markSessionAuthenticated()
      await fetchProfile(SESSION_AUTH_MARKER)
      setError(null)
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [clearAuthState, fetchProfile, markSessionAuthenticated])

  const loginWithFirebaseToken = useCallback(async (idToken: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Firebase login failed')

      markSessionAuthenticated()
      await fetchProfile(SESSION_AUTH_MARKER)

      router.replace('/')
    } finally {
      setLoading(false)
    }
  }, [fetchProfile, router, markSessionAuthenticated])

  const contextValue = useMemo(
    () => ({
      user,
      token,
      signup,
      login,
      logout,
      fetchProfile,
      loading,
      loginWithFirebaseToken,
      refreshToken,
      error,
    }),
    [
      user,
      token,
      signup,
      login,
      logout,
      fetchProfile,
      loading,
      loginWithFirebaseToken,
      refreshToken,
      error,
    ]
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}
