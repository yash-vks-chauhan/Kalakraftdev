// app/components/PasswordChangeForm.tsx
'use client'

import { useState } from 'react'

type Field = {
  name:  string
  label: string
  type:  string
  value?: string
}

type Props = {
  endpoint:     string
  fields:       Field[]         // which inputs to render
  extraFields?: Record<string,string> // e.g. { token: 'XYZ' }
  submitLabel:  string
  onSuccess?:   () => void
}

export default function PasswordChangeForm({
  endpoint,
  fields,
  extraFields = {},
  submitLabel,
  onSuccess,
}: Props) {
  const [values, setValues] = useState(
    Object.fromEntries(fields.map(f => [f.name, f.value || '']))
  )
  const [error, setError]     = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const [ok, setOk]           = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // simple “passwords match” check if you have both fields
    const pw  = values['newPassword']
    const cpw = values['confirmPassword']
    if (pw && cpw && pw !== cpw) {
      setError('Passwords must match.')
      setLoading(false)
      return
    }

    try {
      const body = { ...extraFields, ...values }
      const res  = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || res.statusText)
      setOk(true)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (ok) {
    return <p className="text-green-600">Success! You can now log in with your new password.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      {error && <p className="text-red-600">{error}</p>}
      {fields.map((f) => (
        <label key={f.name} className="block">
          {f.label}
          <input
            type={f.type}
            value={values[f.name]}
            onChange={e => setValues(prev => ({ ...prev, [f.name]: e.target.value }))}
            required
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </label>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
      >
        {loading ? 'Working…' : submitLabel}
      </button>
    </form>
  )
}