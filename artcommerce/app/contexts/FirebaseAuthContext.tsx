'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
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

const getFriendlyServerAuthError = (error: any) => {
  const message = String(error?.message || "")

  if (error?.status === 401) {
    return message || "Google sign-in could not be verified. Please try again."
  }

  if (error?.status >= 500) {
    return message || "The server could not complete sign-in. Please try again later."
  }

  return message || "Failed to authenticate with server"
}

const buildGoogleProvider = () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: "select_account" })
  return provider
}

const shouldUseRedirectForGoogle = () => {
  if (typeof window === 'undefined') return false

  const isSmallViewport = window.matchMedia('(max-width: 768px)').matches
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches
  const isMobileUserAgent = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(window.navigator.userAgent)

  return isSmallViewport || (isCoarsePointer && isMobileUserAgent)
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
  const completedServerLoginUidRef = useRef<string | null>(null)
  const serverLoginPromiseRef = useRef<{ uid: string; promise: Promise<void> } | null>(null)

  const clearServerLoginState = useCallback(() => {
    completedServerLoginUidRef.current = null
    serverLoginPromiseRef.current = null
  }, [])

  const completeServerLogin = useCallback(async (firebaseUser: FirebaseUser) => {
    if (completedServerLoginUidRef.current === firebaseUser.uid) {
      return
    }

    if (serverLoginPromiseRef.current?.uid === firebaseUser.uid) {
      return serverLoginPromiseRef.current.promise
    }

    const serverLoginPromise = firebaseUser
      .getIdToken()
      .then((idToken) => loginWithFirebaseToken(idToken))
      .then(() => {
        completedServerLoginUidRef.current = firebaseUser.uid
      })
      .finally(() => {
        serverLoginPromiseRef.current = null
      })

    serverLoginPromiseRef.current = {
      uid: firebaseUser.uid,
      promise: serverLoginPromise,
    }
    return serverLoginPromise
  }, [loginWithFirebaseToken])

  const signOutAfterServerLoginFailure = useCallback(async () => {
    clearServerLoginState()
    if (auth?.currentUser) {
      await fbSignOut(auth).catch((signOutError) => {
        console.error("Error clearing Firebase session after server login failure:", signOutError)
      })
    }
  }, [clearServerLoginState])

  useEffect(() => {
    if (!auth) {
      setError("Firebase authentication is not configured")
      setLoading(false)
      return
    }

    let isMounted = true

    const restoreRedirectSignIn = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) {
          await completeServerLogin(result.user)
        }
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
          clearServerLoginState()
          setUser(null)
          setLoading(false)
          return
        }

        setUser(firebaseUser)

        completeServerLogin(firebaseUser)
          .catch((tokenError) => {
            console.error("Error in loginWithFirebaseToken:", tokenError)
            if (isMounted) setError(getFriendlyServerAuthError(tokenError))
            return signOutAfterServerLoginFailure()
          })
          .finally(() => {
            if (isMounted) setLoading(false)
          })
      } else {
        clearServerLoginState()
        clearLogoutInProgress()
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [clearServerLoginState, completeServerLogin, signOutAfterServerLoginFailure])

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
      if (shouldUseRedirectForGoogle()) {
        await signInWithRedirect(auth, provider)
        return undefined
      }

      let result: UserCredential
      try {
        result = await signInWithPopup(auth, provider)
      } catch (popupError: any) {
        if (shouldFallbackToRedirect(popupError)) {
          await signInWithRedirect(auth, provider)
          return undefined
        }

        const friendly = getFriendlyAuthError(popupError)
        setError(friendly)
        throw new Error(friendly)
      }

      await completeServerLogin(result.user)
      return result
    } catch (loginError: any) {
      const friendly = loginError?.code
        ? getFriendlyAuthError(loginError)
        : loginError?.message || getFriendlyServerAuthError(loginError)
      setError(friendly)
      await signOutAfterServerLoginFailure()
      throw new Error(friendly)
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
      let result: UserCredential
      try {
        result = await signInWithPopup(auth, provider)
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
      }

      await completeServerLogin(result.user)
      return result
    } catch (serverError: any) {
      const friendly = getFriendlyServerAuthError(serverError)
      setError(friendly)
      await signOutAfterServerLoginFailure()
      throw new Error(friendly)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!auth) return
    clearServerLoginState()
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
