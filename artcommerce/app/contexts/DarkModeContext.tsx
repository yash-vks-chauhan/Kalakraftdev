'use client'

import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

type DarkModeContextType = {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined)

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // Load dark mode preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.role === 'admin') {
      const savedMode = localStorage.getItem('adminDarkMode')
      if (savedMode) {
        setIsDarkMode(savedMode === 'true')
      }
    } else {
      // Ensure dark mode is off for non-admin users
      setIsDarkMode(false)
    }
  }, [user])

  // Save dark mode preference to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.role === 'admin') {
      localStorage.setItem('adminDarkMode', isDarkMode.toString())
      
      // Apply dark mode class to body for global styling
      if (isDarkMode) {
        document.body.classList.add('dark-mode')
      } else {
        document.body.classList.remove('dark-mode')
      }
    } else {
      // Ensure dark mode is off for non-admin users
      document.body.classList.remove('dark-mode')
    }
  }, [isDarkMode, user])

  const toggleDarkMode = () => {
    // Only admin users can toggle dark mode
    if (user?.role === 'admin') {
      setIsDarkMode(prev => !prev)
    }
  }

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export function useDarkMode() {
  const context = useContext(DarkModeContext)
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider')
  }
  return context
} 