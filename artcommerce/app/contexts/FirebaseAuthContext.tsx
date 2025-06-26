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
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import {
  getAuth,
  signOut as fbSignOut,
  User as FirebaseUser,
} from 'firebase/auth'

export interface AuthContextType {
  user: FirebaseUser | null
  loading: boolean
  loginWithGoogle: () => Promise<UserCredential | undefined>
  loginWithFacebook: () => Promise<UserCredential | undefined>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => undefined,
  loginWithFacebook: async () => undefined,
  signOut: async () => {},
})

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  console.log('FirebaseAuthProvider: Initial Render - loading:', loading, 'user:', user)

  useEffect(() => {
    console.log('FirebaseAuthProvider: useEffect triggered')
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('FirebaseAuthProvider: onAuthStateChanged - firebaseUser:', firebaseUser)
      if (firebaseUser) {
        setUser(firebaseUser)
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
  }, [])

  const loginWithGoogle = async () => {
    setLoading(true)
    console.log('FirebaseAuthProvider: signInWithGoogle started - loading set to true')
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      console.log('FirebaseAuthProvider: signInWithGoogle success', result.user)
      return result
    } catch (error) {
      console.error("Firebase Google login error:", error)
      throw error
    } finally {
      setLoading(false)
      console.log('FirebaseAuthProvider: signInWithGoogle finished - loading set to false')
    }
  }

  const loginWithFacebook = async () => {
    setLoading(true)
    console.log('FirebaseAuthProvider: signInWithFacebook started - loading set to true')
    try {
      const provider = new FacebookAuthProvider()
      const result = await signInWithPopup(auth, provider)
      console.log('FirebaseAuthProvider: signInWithFacebook success', result.user)
      return result
    } catch (error) {
      console.error("Firebase Facebook login error:", error)
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
      value={{ user, loading, loginWithGoogle, loginWithFacebook, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useFirebaseAuth() {
  return useContext(AuthContext)
}