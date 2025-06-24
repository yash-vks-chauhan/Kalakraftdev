'use client'
import PasswordChangeForm from '../../components/PasswordChangeForm'
import { useRouter }      from 'next/navigation'

export default function ForgotPasswordRequest() {
  const router = useRouter()
  return (
    <main className="py-12">
      <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
      <PasswordChangeForm
        endpoint="/api/auth/request-password-change"
        fields={[{ name: 'email', label: 'Your email', type: 'email' }]}
        submitLabel="Send Reset Code"
        onSuccess={() => router.push('/auth/forgot-password/verify')}
      />
    </main>
  )
}