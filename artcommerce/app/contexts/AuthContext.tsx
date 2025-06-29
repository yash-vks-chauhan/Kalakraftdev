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
    console.log('AuthContext: Login attempt started');
    setLoading(true);
    setError(null);
    
    try {
      console.log('AuthContext: Making login request');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Important for cookie handling
      });
      
      let data;
      try {
        data = await res.json();
        console.log('AuthContext: Received response', { status: res.status, ok: res.ok });
      } catch (err) {
        console.error('AuthContext: Failed to parse response', err);
        throw new Error('Server error: Invalid response');
      }
      
      if (!res.ok) {
        console.log('AuthContext: Request not OK', { status: res.status, error: data.error });
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

      console.log('AuthContext: Login successful, setting state');
      // Only set auth state if the response was successful
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setError(null);
      
      // Return the data so the login page can handle success
      return data;
    } catch (err: any) {
      console.error('AuthContext: Login error', err);
      // Set the error message
      const errorMessage = err.message || 'Login failed. Please try again';
      setError(errorMessage);
      // Re-throw the error for the login page to handle
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
      console.log('AuthContext: Login attempt finished');
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

  // Add useEffect to track auth state changes
  useEffect(() => {
    console.log('AuthContext: State update', {
      hasUser: !!user,
      hasToken: !!token,
      loading,
      error
    });
  }, [user, token, loading, error]);

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