export const dynamic = 'force-dynamic';
import ResetPasswordClient from '../ResetPasswordClient';

export default async function ForgotPasswordConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const { token = '', email = '' } = await searchParams;

  return <ResetPasswordClient initialCode={token} initialEmail={email} />;
}
