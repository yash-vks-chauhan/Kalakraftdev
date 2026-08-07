// File: app/auth/forgot-password/confirm/page.tsx
export const dynamic = 'force-dynamic'

import ResetFlow from '../../_components/ResetFlow'

/**
 * The address reset emails point at. The code arrives as `?token=`, so the
 * boxes come pre-filled and the person only has to pick a password — but
 * the code is still checked server-side on submit, never here.
 */
export default async function ForgotPasswordConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const { token = '', email = '' } = await searchParams

  return (
    <ResetFlow
      initialPane="code"
      initialEmail={email.trim().toLowerCase()}
      initialCode={token}
    />
  )
}
