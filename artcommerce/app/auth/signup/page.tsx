// File: app/auth/signup/page.tsx
'use client'

import AuthFlow from '../_components/AuthFlow'

/** Same shared flow as /auth/login, opening on the create-account pane. */
export default function SignupPage() {
  return <AuthFlow initialTab="signup" />
}
