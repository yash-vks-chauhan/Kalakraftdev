'use client'

import { useEffect, useState } from 'react'

interface User {
  id: number
  fullName: string
  email: string
}

export default function TestUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users')
        const data = await res.json()

        // If API returned an error status, throw to catch block
        if (!res.ok) throw new Error(data.error || 'Failed to fetch')

        // Guard against data.users being undefined:
        const fetched = Array.isArray(data.users) ? data.users : []
        setUsers(fetched)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  if (loading) return <p className="text-center mt-8">Loading users…</p>
  if (error) return <p className="text-center mt-8 text-red-600">Error: {error}</p>

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Test Users</h1>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul className="space-y-2">
          {users.map((user) => (
            <li key={user.id} className="border p-2 rounded">
              <strong>{user.fullName}</strong> ({user.email})
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}