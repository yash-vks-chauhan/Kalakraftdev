'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyOtpPage() {
  const [code, setCode]         = useState('')
  const [newPw, setNewPw]       = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const router                  = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPw !== confirm) {
      setError('Passwords must match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/confirm-password-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: code, newPassword: newPw }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to reset')
      router.push('/auth/login')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Enter Reset Code</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Reset Code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </label>
        <label className="block">
          New Password
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </label>
        <label className="block">
          Confirm Password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>
    </main>
  )
}