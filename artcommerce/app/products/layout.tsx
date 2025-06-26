'use client'

import styles from './layout.module.css'
import navStyles from '../components/Navbar.module.css'

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={navStyles.pageWrapper}>
      <div className={styles.productContainer}>
        {children}
      </div>
    </div>
  )
}
