// File: app/auth/login/page.tsx
'use client'

import AuthFlow from '../_components/AuthFlow'

/**
 * Sign-in and sign-up share one mounted component so the mobile segmented
 * switch can move between them without a navigation (and without dropping a
 * half-typed email). Both routes stay addressable and keep their own entry
 * point — this one just opens on the sign-in pane.
 */
export default function LoginPage() {
  return <AuthFlow initialTab="signin" />
}
