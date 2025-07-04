export const dynamic = 'force-dynamic';
import ForgotPasswordConfirmClient from './ForgotPasswordConfirmClient';

export default function ForgotPasswordConfirmPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token ?? '';

  return (
    <main className="py-12">
      <h1 className="text-2xl font-bold mb-4">Set a New Password</h1>
      <ForgotPasswordConfirmClient token={token} />
    </main>
  );
}