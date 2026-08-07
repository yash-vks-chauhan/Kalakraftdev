// File: app/auth/forgot-password/sent/page.tsx
import ResetFlow from '../../_components/ResetFlow'

/**
 * Sending no longer navigates here — the flow advances a pane in place.
 * The route is kept because it is in people's history and in older emails,
 * and it opens exactly where it used to: waiting for the code.
 */
export default async function ForgotPasswordSentPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email = '' } = await searchParams
  return <ResetFlow initialPane="code" initialEmail={email.trim().toLowerCase()} />
}
