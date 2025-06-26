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
  getAuth,
} from "firebase/auth"
import { auth } from "../firebase/client"
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import {
  signOut as fbSignOut,
  User as FirebaseUser,
} from 'firebase/auth'
import { useAuth } from './AuthContext'

export interface AuthContextType {
  user: FirebaseUser | null
  loading: boolean
  loginWithGoogle: () => Promise<UserCredential | undefined>
  loginWithFacebook: () => Promise<UserCredential | undefined>
  signOut: () => Promise<void>
  error: string | null
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => undefined,
  loginWithFacebook: async () => undefined,
  signOut: async () => {},
  error: null
})

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { loginWithFirebaseToken } = useAuth()

  console.log('FirebaseAuthProvider: Initial Render - loading:', loading, 'user:', user)

  useEffect(() => {
    console.log('FirebaseAuthProvider: useEffect triggered')
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('FirebaseAuthProvider: onAuthStateChanged - firebaseUser:', firebaseUser)
      if (firebaseUser) {
        setUser(firebaseUser)
        
        // Get ID token to send to backend
        firebaseUser.getIdToken().then(idToken => {
          console.log('Firebase ID token obtained, length:', idToken.length)
          // Send to our backend to create a session
          loginWithFirebaseToken(idToken).catch(err => {
            console.error('Error in loginWithFirebaseToken:', err)
            setError('Failed to authenticate with server')
          })
        }).catch(err => {
          console.error('Error getting Firebase ID token:', err)
          setError('Failed to get authentication token')
        })
      } else {
        setUser(null)
      }
      setLoading(false)
      console.log('FirebaseAuthProvider: onAuthStateChanged - loading set to false')
    })
    return () => {
      console.log('FirebaseAuthProvider: useEffect cleanup')
      unsubscribe()
    }
  }, [loginWithFirebaseToken])

  const loginWithGoogle = async () => {
    setLoading(true)
    setError(null)
    console.log('FirebaseAuthProvider: signInWithGoogle started - loading set to true')
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      const result = await signInWithPopup(auth, provider)
      console.log('FirebaseAuthProvider: signInWithGoogle success', result.user)
      return result
    } catch (error) {
      console.error("Firebase Google login error:", error)
      if (error.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for login. Please add it in Firebase console.')
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Login was cancelled')
      } else {
        setError(`Login failed: ${error.message || 'Unknown error'}`)
      }
      throw error
    } finally {
      setLoading(false)
      console.log('FirebaseAuthProvider: signInWithGoogle finished - loading set to false')
    }
  }

  const loginWithFacebook = async () => {
    setLoading(true)
    setError(null)
    console.log('FirebaseAuthProvider: signInWithFacebook started - loading set to true')
    try {
      const provider = new FacebookAuthProvider()
      const result = await signInWithPopup(auth, provider)
      console.log('FirebaseAuthProvider: signInWithFacebook success', result.user)
      return result
    } catch (error) {
      console.error("Firebase Facebook login error:", error)
      if (error.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for login. Please add it in Firebase console.')
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Login was cancelled')
      } else {
        setError(`Login failed: ${error.message || 'Unknown error'}`)
      }
      throw error
    } finally {
      setLoading(false)
      console.log('FirebaseAuthProvider: signInWithFacebook finished - loading set to false')
    }
  }

  const signOut = async () => {
    console.log('FirebaseAuthProvider: logout started')
    await fbSignOut(auth)
    console.log('FirebaseAuthProvider: logout finished')
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, loginWithGoogle, loginWithFacebook, signOut, error }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useFirebaseAuth() {
  return useContext(AuthContext)
}