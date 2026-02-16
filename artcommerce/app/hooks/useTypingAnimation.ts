import { useState, useEffect, useRef } from 'react'

interface TypingAnimationOptions {
  words: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseBeforeTyping?: number
  pauseBeforeDeletion?: number
}

export function useTypingAnimation({
  words,
  typingSpeed = 180,
  deletingSpeed = 100,
  pauseBeforeTyping = 800,
  pauseBeforeDeletion = 2500,
}: TypingAnimationOptions) {
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const currentWord = words[currentWordIndex]

  useEffect(() => {
    if (words.length === 0) return

    const animate = () => {
      const currentWord = words[currentWordIndex]
      
      if (isTyping) {
        if (displayText.length < currentWord.length) {
          timeoutRef.current = setTimeout(() => {
            setDisplayText(currentWord.slice(0, displayText.length + 1))
          }, typingSpeed)
        } else {
          timeoutRef.current = setTimeout(() => {
            setIsTyping(false)
          }, pauseBeforeDeletion)
        }
      } else {
        if (displayText.length > 0) {
          timeoutRef.current = setTimeout(() => {
            setDisplayText(displayText.slice(0, -1))
          }, deletingSpeed)
        } else {
          timeoutRef.current = setTimeout(() => {
            setCurrentWordIndex((prev) => (prev + 1) % words.length)
            setIsTyping(true)
          }, pauseBeforeTyping)
        }
      }
    }

    animate()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [
    currentWordIndex,
    displayText,
    isTyping,
    words,
    typingSpeed,
    deletingSpeed,
    pauseBeforeTyping,
    pauseBeforeDeletion,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    displayText,
    currentWord: words[currentWordIndex],
    isTyping,
  }
}
