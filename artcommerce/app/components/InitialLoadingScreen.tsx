import Image from 'next/image'
import { getImageUrl } from '../../lib/cloudinaryImages'
import { useEffect, useState } from 'react'
import styles from './InitialLoadingScreen.module.css'

export default function InitialLoadingScreen() {
  const [currentStep, setCurrentStep] = useState(0)
  
  const steps = [
    "Authenticating your account...",
    "Preparing your cart...",
    "Loading your wishlist...",
    "Setting up your dashboard..."
  ]
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 1500)
    
    return () => clearInterval(interval)
  }, [steps.length])
  
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingContent}>
        {/* Art-themed loading animation */}
        <div className={styles.artLoader}>
          {/* Paint brush stroke */}
          <div className={styles.brushStroke}>
            <div className={styles.brushTip}></div>
          </div>
          
          {/* Color palette */}
          <div className={styles.colorPalette}>
            <div className={styles.colorDot} style={{ backgroundColor: '#8B4513', animationDelay: '0s' }}></div>
            <div className={styles.colorDot} style={{ backgroundColor: '#DAA520', animationDelay: '0.2s' }}></div>
            <div className={styles.colorDot} style={{ backgroundColor: '#2F4F4F', animationDelay: '0.4s' }}></div>
            <div className={styles.colorDot} style={{ backgroundColor: '#800080', animationDelay: '0.6s' }}></div>
          </div>
        </div>
        
        {/* Logo */}
        <div className={styles.logoContainer}>
          <Image
            src={getImageUrl('logo.png')}
            alt="Kalakraft Logo"
            width={110}
            height={36}
            className={styles.logo}
            priority
          />
        </div>
        
        {/* Dynamic loading message */}
        <p className={styles.loadingMessage}>{steps[currentStep]}</p>
        
        {/* Progress dots */}
        <div className={styles.progressDots}>
          {steps.map((_, index) => (
            <div 
              key={index}
              className={`${styles.progressDot} ${index === currentStep ? styles.active : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
