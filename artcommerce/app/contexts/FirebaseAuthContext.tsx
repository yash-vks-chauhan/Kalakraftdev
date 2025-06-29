'use client'
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  UserCredential,
} from "firebase/auth"
import { auth } from "../firebase/client"
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: any | null
  loading: boolean
  loginWithGoogle: () => Promise<void>
  loginWithFacebook: () => Promise<void>
  signOut: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log('Setting up Firebase auth listener')
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Firebase auth state changed:', firebaseUser?.email)
      
      if (firebaseUser) {
        try {
          console.log('Getting Firebase ID token...')
          const idToken = await firebaseUser.getIdToken()
          
          console.log('Sending token to backend...')
          const response = await fetch('/api/auth/firebase-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
          })

          const data = await response.json()
          console.log('Backend response:', { ok: response.ok, data })

          if (!response.ok) {
            throw new Error(data.message || 'Failed to authenticate with server')
          }

          console.log('Setting user state:', data.user)
          setUser(data.user)
          
          console.log('Redirecting to home...')
          router.push('/')
        } catch (err: any) {
          console.error('Firebase auth error:', err)
          setError(err.message || 'Authentication failed')
          await signOut(auth)
          setUser(null)
        }
      } else {
        console.log('No Firebase user, clearing state')
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      console.log('Cleaning up Firebase auth listener')
      unsubscribe()
    }
  }, [router])

  const loginWithGoogle = async () => {
    console.log('Starting Google login...')
    setLoading(true)
    setError(null)
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      console.log('Opening Google popup...')
      const result = await signInWithPopup(auth, provider)
      console.log('Google login successful:', result.user.email)
      // Auth state change listener will handle the rest
    } catch (error: any) {
      console.error("Google login error:", error)
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Login was cancelled')
      } else if (error.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for login. Please add it in Firebase console.')
      } else {
        setError(error.message || 'Failed to sign in with Google')
      }
      setLoading(false)
    }
  }

  const loginWithFacebook = async () => {
    console.log('Starting Facebook login...')
    setLoading(true)
    setError(null)
    try {
      const provider = new FacebookAuthProvider()
      console.log('Opening Facebook popup...')
      const result = await signInWithPopup(auth, provider)
      console.log('Facebook login successful:', result.user.email)
      // Auth state change listener will handle the rest
    } catch (error: any) {
      console.error("Facebook login error:", error)
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Login was cancelled')
      } else if (error.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for login. Please add it in Firebase console.')
      } else {
        setError(error.message || 'Failed to sign in with Facebook')
      }
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    console.log('Signing out...')
    try {
      await signOut(auth)
      setUser(null)
      router.push('/auth/login')
    } catch (error: any) {
      setError(error.message || 'Failed to sign out')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithFacebook,
        signOut: handleSignOut,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useFirebaseAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider')
  }
  return context
}