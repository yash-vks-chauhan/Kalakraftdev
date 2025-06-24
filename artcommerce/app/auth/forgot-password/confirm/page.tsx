'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import PasswordChangeForm             from '../../../components/PasswordChangeForm'

export default function ForgotPasswordConfirm() {
  const params = useSearchParams()
  const token  = params.get('token') || ''
  const router = useRouter()

  return (
    <main className="py-12">
      <h1 className="text-2xl font-bold mb-4">Set a New Password</h1>
      <PasswordChangeForm
        endpoint="/api/auth/confirm-password-change"
        fields={[
          { name: 'newPassword',     label: 'New Password',     type: 'password' },
          { name: 'confirmPassword', label: 'Confirm Password', type: 'password' },
        ]}
        extraFields={{ token }}
        submitLabel="Reset Password"
        onSuccess={() => router.push('/auth/login')}
      />
    </main>
  )
}