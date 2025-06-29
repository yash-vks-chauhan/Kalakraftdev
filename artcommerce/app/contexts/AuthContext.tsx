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
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log('AuthProvider: Checking auth status')
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      console.log('AuthProvider: Fetching user data')
      const response = await fetch('/api/auth/me')
      console.log('AuthProvider: /me response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('AuthProvider: User data received:', data)
        setUser(data)
      } else {
        console.log('AuthProvider: No authenticated user')
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
    console.log('AuthProvider: Starting login')
    setLoading(true)
    setError(null)

    try {
      console.log('AuthProvider: Sending login request')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log('AuthProvider: Login response:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      // Update user state with the response data
      setUser(data)
      
      console.log('AuthProvider: Login successful, redirecting')
      router.push('/')
    } catch (err: any) {
      console.error('AuthProvider: Login error:', err)
      setError(err.message || 'An error occurred during login')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    console.log('AuthProvider: Starting logout')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Logout failed')
      }

      setUser(null)
      console.log('AuthProvider: Logout successful, redirecting')
      router.push('/auth/login')
    } catch (err: any) {
      console.error('AuthProvider: Logout error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}