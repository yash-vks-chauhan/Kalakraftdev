'use client'

import { createContext, ReactNode, useEffect, useState, useContext } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  firebaseClientConfig,
  isFirebaseClientConfigured,
  missingFirebaseClientEnv,
} from '../../lib/firebase-client-config'

if (!isFirebaseClientConfigured) {
  console.warn(`Firebase client configuration is incomplete. Missing: ${missingFirebaseClientEnv.join(', ')}`)
}

const app = isFirebaseClientConfigured
  ? getApps().length
    ? getApps()[0]
    : initializeApp(firebaseClientConfig)
  : null

export const auth = app ? getAuth(app) : null
const googleProvider = new GoogleAuthProvider()

export interface AuthContextType {
  user: FirebaseUser | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
})

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error('Firebase authentication is not configured')
    }
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error("Firebase Google login error:", error);
      // Show user-friendly error message
      if (error.code === 'auth/unauthorized-domain') {
        alert('This domain is not authorized for Firebase authentication. Please add it to your Firebase console.');
      } else {
        alert('Authentication error. Please try again later.');
      }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!auth) return
    await fbSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useFirebaseAuth() {
  return useContext(AuthContext)
}
