'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { useAuth } from './AuthContext'

export type AppMode = 'shop' | 'store'

const STORAGE_KEY = 'kalakraft:mobile-mode'

interface AppModeContextValue {
  /** The stored preference. Only meaningful for admins — branch on `isStoreMode`. */
  mode: AppMode
  setMode: (mode: AppMode) => void
  /**
   * The flag callers should actually use: true only when a signed-in admin has
   * chosen store mode. A customer, a signed-out visitor or a demoted admin can
   * never be in store mode, whatever localStorage happens to remember.
   */
  isStoreMode: boolean
}

const AppModeContext = createContext<AppModeContextValue | undefined>(undefined)

/**
 * Which hat the phone is wearing.
 *
 * An admin running the store wants a different bottom dock and a different
 * account sheet from the same person buying something. Rather than appending
 * seven management rows to a customer menu, the two live as modes — and this
 * holds the single bit that says which one is on.
 */
export function AppModeProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const isAdmin = user?.role === 'admin'

  // 'shop' on the server and on first paint. Reading localStorage during
  // render would mismatch hydration, so the stored preference is applied in
  // the effect below instead.
  const [mode, setModeState] = useState<AppMode>('shop')

  useEffect(() => {
    // Wait for the profile fetch to settle. Clearing on the initial
    // user === null would wipe the preference before we know who this is.
    if (loading) return

    if (!isAdmin) {
      // Signing out, or losing the role, drops the mode — otherwise a demoted
      // admin keeps a store-shaped dock full of pages they can no longer open.
      setModeState('shop')
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {}
      return
    }

    try {
      if (window.localStorage.getItem(STORAGE_KEY) === 'store') {
        setModeState('store')
      }
    } catch {}
  }, [loading, isAdmin])

  const setMode = useCallback((next: AppMode) => {
    setModeState(next)
    try {
      if (next === 'store') window.localStorage.setItem(STORAGE_KEY, 'store')
      else window.localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }, [])

  const value = useMemo<AppModeContextValue>(
    () => ({ mode, setMode, isStoreMode: Boolean(isAdmin) && mode === 'store' }),
    [mode, setMode, isAdmin]
  )

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
}

export function useAppMode(): AppModeContextValue {
  const ctx = useContext(AppModeContext)
  if (!ctx) {
    throw new Error('useAppMode must be used within an AppModeProvider')
  }
  return ctx
}
