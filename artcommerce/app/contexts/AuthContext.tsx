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
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const logout = useCallback(async () => {
    try {
      // First clear all local state
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
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
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to refresh token');
      
      const newToken = data.token;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      return newToken;
    } catch (err) {
      console.error('Failed to refresh token:', err);
      logout();
      return null;
    }
  }, [token, logout]);

  const fetchProfile = useCallback(async (currentToken?: string | null) => {
    const activeToken = currentToken || token;
    
    if (!activeToken) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      
      if (res.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          return fetchProfile(newToken);
        }
        throw new Error('Token refresh failed');
      }
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }
      
      if (!data.user) {
        throw new Error('No user data in response');
      }
      
      setToken(activeToken);
      localStorage.setItem('token', activeToken);
      setUser(data.user);
    } catch (err) {
      console.error("Fetch profile error:", err);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token, refreshToken, logout]);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      fetchProfile(savedToken).catch((err) => {
        console.error('Profile fetch error:', err);
        // Clear everything if profile fetch fails
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        sessionStorage.clear();
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

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

      setToken(data.token);
      localStorage.setItem('token', data.token);
      await fetchProfile(data.token);
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
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Clear any existing auth state
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        
        // Handle different error cases
        if (res.status === 401) {
          const error = new Error('Invalid email or password');
          setError(error.message);
          throw error;
        }
        if (res.status === 400) {
          const error = new Error('Missing fields');
          setError(error.message);
          throw error;
        }
        // For network errors
        if (!res.status) {
          const error = new Error('Network error occurred');
          setError(error.message);
          throw error;
        }
        // For other errors, use the server's error message
        const error = new Error(data.error || 'Login failed');
        setError(error.message);
        throw error;
      }

      // Clear any previous errors
      setError(null);

      // Set auth state on success
      setToken(data.token);
      localStorage.setItem('token', data.token);
      await fetchProfile(data.token);
    } catch (error: any) {
      // Ensure we're throwing an Error object with the message
      if (error instanceof Error) {
        throw error;
      }
      const newError = new Error(error.message || 'Login failed');
      setError(newError.message);
      throw newError;
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

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

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      
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