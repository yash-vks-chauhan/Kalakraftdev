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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken()
          const response = await fetch('/api/auth/firebase-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.message || 'Failed to authenticate with server')
          }

          setUser(firebaseUser)
          router.push('/')
        } catch (err: any) {
          console.error('Firebase auth error:', err)
          setError(err.message || 'Authentication failed')
          await signOut(auth)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const loginWithGoogle = async () => {
    setLoading(true)
    setError(null)
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      await signInWithPopup(auth, provider)
      // The rest is handled by onAuthStateChanged
    } catch (error: any) {
      console.error("Firebase Google login error:", error)
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
    setLoading(true)
    setError(null)
    try {
      const provider = new FacebookAuthProvider()
      await signInWithPopup(auth, provider)
      // The rest is handled by onAuthStateChanged
    } catch (error: any) {
      console.error("Firebase Facebook login error:", error)
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
    try {
      await signOut(auth)
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