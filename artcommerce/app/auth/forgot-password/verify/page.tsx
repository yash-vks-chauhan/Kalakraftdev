import ResetPasswordClient from '../ResetPasswordClient'

export default async function ForgotPasswordVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; otp?: string }>
}) {
  const { email = '', otp = '' } = await searchParams

  return <ResetPasswordClient initialEmail={email} initialCode={otp} />
}
