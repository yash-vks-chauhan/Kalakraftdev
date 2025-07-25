'use client'

import { createContext, ReactNode, useEffect, useState, useContext } from 'react'
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
}

// Log Firebase config for debugging (without sensitive values)
console.log('Firebase config loaded:', {
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  apiKeyPresent: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY
});

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const auth = getAuth(app)
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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
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