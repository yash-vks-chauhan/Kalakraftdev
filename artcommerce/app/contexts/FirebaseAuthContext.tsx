'use client'

import React, { createContext, useContext, useEffect, useState } from "react"
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  FacebookAuthProvider,
  UserCredential,
  signOut as fbSignOut,
  User as FirebaseUser,
} from "firebase/auth"
import { auth } from "../firebase/client"
import { useAuth } from "./AuthContext"
const LOGOUT_IN_PROGRESS_KEY = 'artcommerce:logout_in_progress'

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
  error: null,
})

const getFriendlyAuthError = (error: any) => {
  const code = String(error?.code || "")
  const message = String(error?.message || "Unknown error")

  if (code === "auth/unauthorized-domain") {
    return "This domain is not authorized for login. Add it in Firebase Authentication > Settings > Authorized domains."
  }
  if (code === "auth/popup-closed-by-user") {
    return "Login was cancelled."
  }
  if (code === "auth/popup-blocked") {
    return "Your browser blocked the sign-in popup."
  }
  if (code === "auth/internal-error") {
    return "Google sign-in popup failed in this browser. A redirect sign-in fallback was triggered."
  }
  return `Login failed: ${message}`
}

const shouldFallbackToRedirect = (error: any) => {
  const code = String(error?.code || "")
  return code === "auth/internal-error" || code === "auth/popup-blocked"
}

const buildGoogleProvider = () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: "select_account" })
  return provider
}

const isLogoutInProgress = () => {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(LOGOUT_IN_PROGRESS_KEY) === '1'
}

const clearLogoutInProgress = () => {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(LOGOUT_IN_PROGRESS_KEY)
}

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { loginWithFirebaseToken } = useAuth()

  useEffect(() => {
    if (!auth) {
      setError("Firebase authentication is not configured")
      setLoading(false)
      return
    }

    let isMounted = true

    const restoreRedirectSignIn = async () => {
      try {
        await getRedirectResult(auth)
      } catch (redirectError: any) {
        if (isMounted) {
          setError(getFriendlyAuthError(redirectError))
        }
      }
    }

    restoreRedirectSignIn()

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!isMounted) return

      if (firebaseUser) {
        if (isLogoutInProgress()) {
          setUser(null)
          setLoading(false)
          return
        }

        setUser(firebaseUser)

        firebaseUser.getIdToken().then((idToken) => {
          loginWithFirebaseToken(idToken).catch((tokenError) => {
            console.error("Error in loginWithFirebaseToken:", tokenError)
            setError("Failed to authenticate with server")
          })
        }).catch((idTokenError) => {
          console.error("Error getting Firebase ID token:", idTokenError)
          setError("Failed to get authentication token")
        })
      } else {
        clearLogoutInProgress()
        setUser(null)
      }

      setLoading(false)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [loginWithFirebaseToken])

  const loginWithGoogle = async () => {
    if (!auth) {
      setError("Firebase authentication is not configured")
      return undefined
    }

    setLoading(true)
    setError(null)
    clearLogoutInProgress()

    const provider = buildGoogleProvider()

    try {
      const result = await signInWithPopup(auth, provider)
      return result
    } catch (popupError: any) {
      if (shouldFallbackToRedirect(popupError)) {
        try {
          await signInWithRedirect(auth, provider)
          return undefined
        } catch (redirectError: any) {
          const friendly = getFriendlyAuthError(redirectError)
          setError(friendly)
          throw redirectError
        }
      }

      const friendly = getFriendlyAuthError(popupError)
      setError(friendly)
      throw popupError
    } finally {
      setLoading(false)
    }
  }

  const loginWithFacebook = async () => {
    if (!auth) {
      setError("Firebase authentication is not configured")
      return undefined
    }

    setLoading(true)
    setError(null)
    clearLogoutInProgress()

    const provider = new FacebookAuthProvider()

    try {
      const result = await signInWithPopup(auth, provider)
      return result
    } catch (popupError: any) {
      if (shouldFallbackToRedirect(popupError)) {
        try {
          await signInWithRedirect(auth, provider)
          return undefined
        } catch (redirectError: any) {
          const friendly = getFriendlyAuthError(redirectError)
          setError(friendly)
          throw redirectError
        }
      }

      const friendly = getFriendlyAuthError(popupError)
      setError(friendly)
      throw popupError
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!auth) return
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(LOGOUT_IN_PROGRESS_KEY, '1')
    }
    await fbSignOut(auth)
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
