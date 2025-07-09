'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import Link from 'next/link'
import MobileUserManagement from './MobileUserManagement'
import { useIsMobile } from '../../../../lib/utils'
import { useSearchParams } from 'next/navigation'

interface UserRow {
  id: number
  fullName: string
  email: string
  role: string
  createdAt: string
  abandonedCartCount: number
}

export default function AdminUsersPage() {
  const { token, user } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  const [forceDesktopView, setForceDesktopView] = useState(false)
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pref = localStorage.getItem('viewPreference')
      if (pref === 'desktop') setForceDesktopView(true)
    }
  }, [])

  useEffect(() => {
    if (user?.role !== 'admin') return
    fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(json => {
        setUsers(json.users)
        filterUsers(json.users, filterParam)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token, user, filterParam])

  const filterUsers = (userList: UserRow[], filter: string | null) => {
    if (!filter) {
      setFilteredUsers(userList)
      return
    }
    
    const filtered = userList.filter(u => u.role === filter)
    setFilteredUsers(filtered)
  }

  // Use mobile view if on mobile device and not forcing desktop view
  if (isMobile && !forceDesktopView) {
    return <MobileUserManagement initialFilter={filterParam === 'user' ? 'user' : 'admin'} />
  }

  if (user?.role !== 'admin') {
    return <p className="p-8">Unauthorized</p>
  }
  if (loading) return <p className="p-8">Loading users…</p>

  const displayUsers = filterParam ? filteredUsers : users

  async function onRoleChange(id: number, newRole: string) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ userId: id, role: newRole })
    })
    if (!res.ok) {
      alert('Failed to update role')
    } else {
      const { user: updated } = await res.json()
      const updatedUsers = users.map(u => u.id === id ? updated : u)
      setUsers(updatedUsers)
      filterUsers(updatedUsers, filterParam)
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>
      
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {['Name','Email','Role','Actions','Joined','View Orders','Abandoned Cart','Remind'].map(h => (
              <th key={h} className="border px-4 py-2 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayUsers.map(u => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="border px-4 py-2">{u.fullName}</td>
              <td className="border px-4 py-2">{u.email}</td>
              <td className="border px-4 py-2 capitalize">{u.role}</td>
              <td className="border px-4 py-2">
                <select
                  value={u.role}
                  onChange={e => onRoleChange(u.id, e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="button"
                  className="ml-2 text-red-600 hover:underline"
                  onClick={async () => {
                    if (!confirm(`Delete ${u.fullName}?`)) return;
                    const res = await fetch(`/api/admin/users/${u.id}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                      const updatedUsers = users.filter(x => x.id !== u.id);
                      setUsers(updatedUsers);
                      filterUsers(updatedUsers, filterParam);
                    } else {
                      alert('Failed to delete user');
                    }
                  }}
                >
                  Delete
                </button>
              </td>
              <td className="border px-4 py-2">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="border px-4 py-2">
                <Link
                  href={`/dashboard/admin/orders?userId=${u.id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Orders
                </Link>
              </td>
              <td className="border px-4 py-2">
                {u.abandonedCartCount}
              </td>
              <td className="border px-4 py-2">
                <button
                  disabled={u.abandonedCartCount === 0}
                  onClick={() =>
                    fetch(`/api/admin/users/${u.id}/remind-cart`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` }
                    }).then(() => alert('Reminder sent!'))
                  }
                  className={`px-2 py-1 rounded ${
                    u.abandonedCartCount > 0
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Remind
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}