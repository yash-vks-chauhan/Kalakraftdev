// File: app/auth/forgot-password/confirm/ForgotPasswordConfirmClient.tsx
'use client';

import { useRouter } from 'next/navigation';
import PasswordChangeForm from '../../../components/PasswordChangeForm';

interface Props {
  token: string;
}

export default function ForgotPasswordConfirmClient({ token }: Props) {
  const router = useRouter();

  return (
    <PasswordChangeForm
      endpoint="/api/auth/confirm-password-change"
      fields={[
        { name: 'newPassword', label: 'New Password', type: 'password' },
        { name: 'confirmPassword', label: 'Confirm Password', type: 'password' },
      ]}
      extraFields={{ token }}
      submitLabel="Reset Password"
      onSuccess={() => router.push('/auth/login')}
    />
  );
} 