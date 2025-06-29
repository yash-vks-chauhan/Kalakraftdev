// File: app/contexts/AuthContext.tsx

'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'

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

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log('AuthProvider: Checking initial auth state')
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      console.log('AuthProvider: Fetching current user')
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        console.log('AuthProvider: User data received:', { hasData: !!userData })
        setUser(userData)
      } else {
        console.log('AuthProvider: No authenticated user found')
        setUser(null)
      }
    } catch (err) {
      console.error('AuthProvider: Error checking auth:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    console.log('AuthProvider: Starting login process')
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      console.log('AuthProvider: Login response received:', { status: response.status })
      const data = await response.json()

      if (!response.ok) {
        console.error('AuthProvider: Login failed:', data.message)
        throw new Error(data.message || 'An error occurred during login')
      }

      console.log('AuthProvider: Login successful, setting user data')
      setUser(data)
      router.push('/')
    } catch (err: any) {
      console.error('AuthProvider: Login error:', err)
      setError(err.message || 'An error occurred during login')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email: string, password: string, name: string) => {
    console.log('AuthProvider: Starting signup process')
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      })

      console.log('AuthProvider: Signup response received:', { status: response.status })
      const data = await response.json()

      if (!response.ok) {
        console.error('AuthProvider: Signup failed:', data.message)
        throw new Error(data.message || 'An error occurred during signup')
      }

      console.log('AuthProvider: Signup successful, setting user data')
      setUser(data)
      router.push('/')
    } catch (err: any) {
      console.error('AuthProvider: Signup error:', err)
      setError(err.message || 'An error occurred during signup')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    console.log('AuthProvider: Starting logout process')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        console.error('AuthProvider: Logout failed')
        throw new Error('Logout failed')
      }

      console.log('AuthProvider: Logout successful')
      setUser(null)
      router.push('/auth/login')
    } catch (err: any) {
      console.error('AuthProvider: Logout error:', err)
      setError(err.message || 'An error occurred during logout')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    signup,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}