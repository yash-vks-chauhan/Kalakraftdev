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
  User as FirebaseUser,
} from "firebase/auth"
import { getAuth } from "firebase/auth"
import { useRouter } from 'next/navigation'
import { initializeApp, getApps } from 'firebase/app'

// Initialize Firebase if not already initialized
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

if (!getApps().length) {
  initializeApp(firebaseConfig)
}

const auth = getAuth()
const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()

// Configure providers
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // Add cross-origin isolation settings
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
})

interface FirebaseAuthContextType {
  user: FirebaseUser | null
  loading: boolean
  error: string | null
  loginWithGoogle: () => Promise<void>
  loginWithFacebook: () => Promise<void>
  logout: () => Promise<void>
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined)

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log('FirebaseAuthProvider: Setting up auth state listener')
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('FirebaseAuthProvider: Auth state changed', { 
        isAuthenticated: !!firebaseUser,
        email: firebaseUser?.email 
      })
      
      if (firebaseUser) {
        try {
          // Get the ID token
          const idToken = await firebaseUser.getIdToken()
          
          // Call your backend to set up the session
          const response = await fetch('/api/auth/firebase-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: idToken }),
            credentials: 'include', // Important for cookie handling
          })

          if (!response.ok) {
            console.error('FirebaseAuthProvider: Backend session setup failed')
            throw new Error('Failed to set up session')
          }

          console.log('FirebaseAuthProvider: Backend session established')
          setUser(firebaseUser)
          router.push('/')
        } catch (err) {
          console.error('FirebaseAuthProvider: Session setup error:', err)
          setError('Failed to complete authentication')
          await signOut(auth)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const handleSocialLogin = async (provider: GoogleAuthProvider | FacebookAuthProvider) => {
    try {
      setError(null)
      setLoading(true)
      console.log(`FirebaseAuthProvider: Starting ${provider instanceof GoogleAuthProvider ? 'Google' : 'Facebook'} login`)
      
      // Configure popup settings
      const result = await signInWithPopup(auth, provider)
      console.log('FirebaseAuthProvider: Social login successful', {
        email: result.user.email
      })
      
      // The session setup will be handled by the onAuthStateChanged listener
    } catch (err: any) {
      console.error('FirebaseAuthProvider: Social login error:', err)
      setError(err.message || 'Failed to authenticate')
      setLoading(false)
    }
  }

  const loginWithGoogle = () => handleSocialLogin(googleProvider)
  const loginWithFacebook = () => handleSocialLogin(facebookProvider)

  const logout = async () => {
    try {
      console.log('FirebaseAuthProvider: Starting logout')
      await signOut(auth)
      console.log('FirebaseAuthProvider: Logout successful')
      router.push('/auth/login')
    } catch (err: any) {
      console.error('FirebaseAuthProvider: Logout error:', err)
      setError(err.message || 'Failed to logout')
    }
  }

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        loading,
        error,
        loginWithGoogle,
        loginWithFacebook,
        logout,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  )
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext)
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider')
  }
  return context
}