export default function ForgotPasswordSent() {
    return (
      <main className="container mx-auto px-4 py-12 max-w-md">
        <h1 className="text-2xl font-bold mb-4">Check Your Inbox</h1>
        <p>
          If that email exists, we’ve sent you a <strong>reset code</strong>.
          <br />
          <a
            href="/auth/forgot-password/verify"
            className="text-blue-600 hover:underline"
          >
            Enter it here
          </a>
          .
        </p>
      </main>
    )
  }