'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import Link from 'next/link'
import { User, Package, ChevronRight, Mail, Calendar, RefreshCw, Shield, Trash2, Send, Users, LogOut } from 'lucide-react'
import styles from '../../mobile-dashboard.module.css'

interface UserRow {
  id: number
  fullName: string
  email: string
  role: string
  createdAt: string
  abandonedCartCount: number
}

export default function MobileUserManagement() {
  const { token, user } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState<number | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') return
    fetchUsers()
  }, [token, user])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  async function onRoleChange(id: number, newRole: string) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId: id, role: newRole })
      })
      
      if (!res.ok) {
        throw new Error('Failed to update role')
      }
      
      const { user: updated } = await res.json()
      setUsers(u => u.map(u => u.id === id ? updated : u))
    } catch (error) {
      alert('Failed to update role')
      console.error(error)
    }
  }

  async function handleDeleteUser(id: number, name: string) {
    if (!confirm(`Delete ${name}?`)) return
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (res.ok) {
        setUsers(us => us.filter(x => x.id !== id))
      } else {
        throw new Error('Failed to delete user')
      }
    } catch (error) {
      alert('Failed to delete user')
      console.error(error)
    }
  }

  async function sendCartReminder(id: number) {
    try {
      await fetch(`/api/admin/users/${id}/remind-cart`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Reminder sent!')
    } catch (error) {
      alert('Failed to send reminder')
      console.error(error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    })
  }

  const handleLogout = () => {
    if (showLogoutConfirm) {
      // Call logout function from auth context
      window.location.href = '/auth/logout'
    } else {
      setShowLogoutConfirm(true)
      // Auto hide after 3 seconds
      setTimeout(() => setShowLogoutConfirm(false), 3000)
    }
  }

  if (user?.role !== 'admin') {
    return <p className="p-4 text-red-500">Unauthorized</p>
  }

  return (
    <div className={styles.mobileDashboardContainer}>
      <h1 className={styles.mobileHeader}>
        User Management
        <button 
          onClick={handleLogout}
          className={showLogoutConfirm ? "text-red-500" : "text-gray-500"}
        >
          <LogOut size={20} />
        </button>
      </h1>
      
      <div className={styles.userProfile}>
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`${user.fullName}'s avatar`}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatar}>
            <User size={30} />
          </div>
        )}
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user.fullName}</span>
          <span className={styles.userRole}>{user.role}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-gray-500">
          Total Users: <span className="text-black">{users.length}</span>
        </div>
        <button 
          onClick={fetchUsers}
          className={loading ? `${styles.refreshButton} ${styles.refreshing}` : styles.refreshButton}
          disabled={loading}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className={styles.emptyState}>
          <RefreshCw className={`${styles.emptyStateIcon} ${styles.refreshing}`} size={24} />
          <p className={styles.emptyStateText}>Loading users...</p>
        </div>
      ) : (
        <ul className={styles.menuList}>
          {users.map(u => (
            <li key={u.id}>
              <div 
                className={styles.menuItem}
                onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
              >
                <div className={styles.menuIcon}>
                  <User size={18} />
                </div>
                <div className={styles.menuItemText}>
                  <div className="font-medium">{u.fullName}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Mail size={10} /> {u.email}
                  </div>
                </div>
                <div className={`${u.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'} text-xs px-2 py-1 rounded-full capitalize`}>
                  {u.role}
                </div>
                <ChevronRight size={20} className={expandedUser === u.id ? "transform rotate-90" : ""} />
              </div>
              
              {expandedUser === u.id && (
                <div className="bg-gray-50 p-4 rounded-b-lg border-t border-gray-100 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={14} />
                    <span>Joined: {formatDate(u.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-gray-500">Role:</span>
                      <select
                        value={u.role}
                        onChange={e => onRoleChange(u.id, e.target.value)}
                        className="ml-2 border rounded px-2 py-1 text-sm"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteUser(u.id, u.fullName)}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/dashboard/admin/orders?userId=${u.id}`}
                      className="flex items-center gap-1 text-blue-600 text-sm"
                    >
                      <Package size={14} />
                      View Orders
                    </Link>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        Cart: <span className="font-medium">{u.abandonedCartCount}</span>
                      </span>
                      
                      {u.abandonedCartCount > 0 && (
                        <button
                          onClick={() => sendCartReminder(u.id)}
                          className="flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-1 rounded"
                        >
                          <Send size={12} />
                          Remind
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 