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

interface MobileUserManagementProps {
  initialFilter?: string;
}

export default function MobileUserManagement({ initialFilter = 'admin' }: MobileUserManagementProps) {
  const { token, user } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState<number | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showAdmins, setShowAdmins] = useState(initialFilter === 'admin')

  useEffect(() => {
    if (user?.role !== 'admin') return
    fetchUsers()
  }, [token, user])

  useEffect(() => {
    if (users.length > 0) {
      setFilteredUsers(users.filter(u => showAdmins ? u.role === 'admin' : u.role === 'user'))
    }
  }, [users, showAdmins])

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

  const toggleShowAdmins = (value: boolean) => {
    setExpandedUser(null); // Close any expanded user when switching views
    setShowAdmins(value);
  };

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

      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-500">
            {showAdmins ? 'Admins' : 'Regular Users'}: <span className="text-black">{filteredUsers.length}</span>
          </div>
          <button 
            onClick={fetchUsers}
            className={loading ? `${styles.refreshButton} ${styles.refreshing}` : styles.refreshButton}
            disabled={loading}
          >
            <RefreshCw size={16} />
          </button>
        </div>
        
        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200">
          <span className="text-sm font-medium ml-2 text-gray-600">Show:</span>
          <div className="flex items-center bg-white rounded-full p-1 shadow-sm">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleShowAdmins(true);
              }}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ${
                showAdmins 
                  ? 'bg-gray-800 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Admins
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleShowAdmins(false);
              }}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ${
                !showAdmins 
                  ? 'bg-gray-800 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Users
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.emptyState}>
          <RefreshCw className={`${styles.emptyStateIcon} ${styles.refreshing}`} size={24} />
          <p className={styles.emptyStateText}>Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={24} className={styles.emptyStateIcon} />
          <p className={styles.emptyStateText}>No {showAdmins ? 'admin' : 'regular'} users found</p>
        </div>
      ) : (
        <ul className={styles.menuList}>
          {filteredUsers.map(u => (
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
                <ChevronRight 
                  size={20} 
                  className={`transform transition-transform duration-300 ${expandedUser === u.id ? "rotate-90" : ""}`} 
                />
              </div>
              
              <div className={`${styles.expandableContent} ${expandedUser === u.id ? styles.expanded : ''}`}>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(u.id, u.fullName);
                      }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            sendCartReminder(u.id);
                          }}
                          className="flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-1 rounded"
                        >
                          <Send size={12} />
                          Remind
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 