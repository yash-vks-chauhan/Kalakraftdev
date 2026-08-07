// File: app/auth/forgot-password/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import ResetFlow from '../_components/ResetFlow'

/**
 * The whole reset — email, code, new password — is one mounted component
 * with four panes, so nothing about it costs a page load. The routes below
 * (`/sent`, `/verify`, `/confirm`) still resolve; they just open the flow
 * at the pane they always meant.
 */
function ForgotPasswordEntry() {
  const params = useSearchParams()
  return <ResetFlow initialPane="email" initialEmail={params.get('email') ?? ''} />
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordEntry />
    </Suspense>
  )
}
