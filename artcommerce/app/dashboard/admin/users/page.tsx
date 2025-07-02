'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import Link from 'next/link'
import styles from './users.module.css'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'admin') return
    fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(json => setUsers(json.users))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token, user])

  if (user?.role !== 'admin') {
    return <p className={styles.unauthorized}>Unauthorized</p>
  }
  if (loading) return <p className={styles.loading}>Loading users…</p>

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
      setUsers(u => u.map(u => u.id === id ? updated : u))
    }
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>User Management</h1>
      <div className={styles.userList}>
        {users.map(u => (
          <div key={u.id} className={styles.userCard}>
            <div className={styles.userInfo}>
              <div className={styles.nameEmail}>
                <h3 className={styles.userName}>{u.fullName}</h3>
                <p className={styles.userEmail}>{u.email}</p>
              </div>
              <div className={styles.roleDate}>
                <div className={styles.roleSelect}>
                  <label className={styles.label}>Role:</label>
                  <select
                    value={u.role}
                    onChange={e => onRoleChange(u.id, e.target.value)}
                    className={styles.select}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <p className={styles.joinDate}>
                  <span className={styles.label}>Joined:</span>
                  {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className={styles.userActions}>
              <div className={styles.cartInfo}>
                <span className={styles.label}>Abandoned Cart:</span>
                <span className={styles.cartCount}>{u.abandonedCartCount}</span>
                <button
                  disabled={u.abandonedCartCount === 0}
                  onClick={() =>
                    fetch(`/api/admin/users/${u.id}/remind-cart`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` }
                    }).then(() => alert('Reminder sent!'))
                  }
                  className={`${styles.remindButton} ${u.abandonedCartCount === 0 ? styles.disabled : ''}`}
                >
                  Remind
                </button>
              </div>
              <div className={styles.actionButtons}>
                <Link
                  href={`/dashboard/admin/orders?userId=${u.id}`}
                  className={styles.viewOrdersButton}
                >
                  View Orders
                </Link>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={async () => {
                    if (!confirm(`Delete ${u.fullName}?`)) return;
                    const res = await fetch(`/api/admin/users/${u.id}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                      setUsers(us => us.filter(x => x.id !== u.id));
                    } else {
                      alert('Failed to delete user');
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}