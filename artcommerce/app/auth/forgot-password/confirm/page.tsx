export const dynamic = 'force-dynamic';
import ForgotPasswordConfirmClient from './ForgotPasswordConfirmClient';

export default async function ForgotPasswordConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token = '' } = await searchParams;

  return (
    <main className="py-12">
      <h1 className="text-2xl font-bold mb-4">Set a New Password</h1>
      <ForgotPasswordConfirmClient token={token} />
    </main>
  );
}
