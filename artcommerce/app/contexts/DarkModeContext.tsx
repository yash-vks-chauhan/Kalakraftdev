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
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('adminDarkMode')
      if (savedMode && user?.role === 'admin') {
        setIsDarkMode(savedMode === 'true')
      }
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
    }
  }, [isDarkMode, user])

  const toggleDarkMode = () => {
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