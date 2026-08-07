// File: app/auth/forgot-password/verify/page.tsx
import ResetFlow from '../../_components/ResetFlow'

export default async function ForgotPasswordVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; otp?: string }>
}) {
  const { email = '', otp = '' } = await searchParams

  return (
    <ResetFlow
      initialPane="code"
      initialEmail={email.trim().toLowerCase()}
      initialCode={otp}
    />
  )
}
