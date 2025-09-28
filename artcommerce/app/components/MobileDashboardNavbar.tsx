'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import styles from './MobileDashboardNavbar.module.css'

interface MobileDashboardNavbarProps {
  title: string
  showBackButton?: boolean
  backUrl?: string
  rightContent?: React.ReactNode
}

export default function MobileDashboardNavbar({ 
  title, 
  showBackButton = true, 
  backUrl,
  rightContent 
}: MobileDashboardNavbarProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl)
    } else {
      router.back()
    }
  }

  return (
    <div className={styles.navbar}>
      <div className={styles.navbarContent}>
        <div className={styles.navbarLeft}>
          {showBackButton && (
            <button 
              onClick={handleBack}
              className={styles.backButton}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className={styles.title}>Dashboard</h1>
        </div>
        
        {rightContent && (
          <div className={styles.navbarRight}>
            {rightContent}
          </div>
        )}
      </div>
    </div>
  )
}
