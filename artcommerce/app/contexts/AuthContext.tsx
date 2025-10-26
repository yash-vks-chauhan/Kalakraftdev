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

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null) // maintained for backward-compat, not persisted
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const logout = useCallback(async () => {
    try {
      // First clear all local state
      setToken(null);
      setUser(null);
      try { localStorage.removeItem('token'); } catch {}
      sessionStorage.clear(); // Clear any session storage
      
      // Then call logout API to clear the cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Important for cookie handling
      });
      
      // Navigate to login page instead of home
      router.replace('/auth/login');
      
      // No need for reload, just ensure loading is false
      setLoading(false);
    } catch (err) {
      console.error('Logout error:', err);
      // Still ensure state is cleared
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      sessionStorage.clear();
      setLoading(false);
      router.replace('/auth/login');
    }
  }, [router]);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    // Deprecated: using httpOnly cookie now. Keep for compatibility.
    return null;
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) {
        setUser(null);
        setToken(null);
        return;
      }
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        await fetchProfile()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [fetchProfile])

  const signup = useCallback(async (fullName: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');

      // Cookie is set httpOnly; just fetch profile
      await fetchProfile();
      router.replace('/');
    } finally {
      setLoading(false);
    }
  }, [router, fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // cookie handling
      });
      
      let data;
      try {
        data = await res.json();
      } catch (err) {
        throw new Error('Server error: Invalid response');
      }
      
      if (!res.ok) {
        // Clear any existing auth state
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        
        // Handle different error cases
        if (res.status === 401) {
          throw new Error('The email or password you entered is incorrect');
        }
        if (res.status === 400) {
          if (data.error === 'Missing fields') {
            throw new Error('Please enter both email and password');
          }
          throw new Error(data.error || 'Invalid request');
        }
        // For network errors
        if (!res.status) {
          throw new Error('Network error. Please check your connection and try again');
        }
        // For other errors, use the server's error message
        throw new Error(data.error || 'Login failed. Please try again');
      }

      // Cookie is set; update user from response/body
      setUser(data.user);
      setError(null);
      
      // Return the data so the login page can handle success
      return data;
    } catch (err: any) {
      // Set the error message
      const errorMessage = err.message || 'Login failed. Please try again';
      setError(errorMessage);
      // Re-throw the error for the login page to handle
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithFirebaseToken = useCallback(async (idToken: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Firebase login failed');
      // Cookie is set; set user
      setUser(data.user);
      
      router.replace('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const contextValue = useMemo(() => ({
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
  }), [user, token, signup, login, logout, fetchProfile, loading, loginWithFirebaseToken, refreshToken, error]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}
