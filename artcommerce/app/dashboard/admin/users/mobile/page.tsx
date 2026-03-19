'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../contexts/AuthContext'
import { useSearchParams } from 'next/navigation'
import styles from './mobile-users.module.css'
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiTrash2, FiShoppingCart, FiMail, FiCalendar, FiUser, FiShield, FiChevronLeft } from 'react-icons/fi'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import ConfirmDialog from '../../../../components/ConfirmDialog'

interface UserRow {
  id: number
  fullName: string
  email: string
  role: string
  createdAt: string
  abandonedCartCount: number
}

export default function MobileAdminUsersPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all')
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter')

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Unauthorized')
      setIsLoading(false)
      return
    }

    // Set initial role filter based on URL parameter
    if (filterParam && (filterParam === 'user' || filterParam === 'admin')) {
      setRoleFilter(filterParam)
    }

    fetchUsers()
  }, [token, user, filterParam])

  // Handle search and filter changes
  useEffect(() => {
    if (users.length > 0) {
      filterUsers(users, filterParam)
    }
  }, [searchQuery, roleFilter])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error((await response.json()).error || response.statusText)
      }

      const data = await response.json()
      setUsers(data.users || [])
      filterUsers(data.users || [], filterParam)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const filterUsers = (userList: UserRow[], filter: string | null) => {
    let filtered = userList

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      )
    }

    // Apply role filter (prioritize URL filter param over local filter)
    const activeRoleFilter = filter || (roleFilter !== 'all' ? roleFilter : null)
    if (activeRoleFilter) {
      filtered = filtered.filter(user => user.role === activeRoleFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleRoleChange = async (id: number, newRole: string) => {
    setIsTransitioning(true)
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
      const updatedUsers = users.map(u => u.id === id ? updated : u)
      setUsers(updatedUsers)
      filterUsers(updatedUsers, filterParam)
    } catch (err: any) {
      alert('Failed to update role: ' + err.message)
    } finally {
      setIsTransitioning(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to delete user')
      }

      const updatedUsers = users.filter(userItem => userItem.id !== deleteTarget.id)
      setUsers(updatedUsers)
      filterUsers(updatedUsers, filterParam)
      setDeleteTarget(null)
    } catch (err: any) {
      alert('Failed to delete user: ' + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRemindCart = async (userId: number) => {
    setIsTransitioning(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/remind-cart`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to send reminder')
      }

      alert('Cart reminder sent successfully!')
    } catch (err: any) {
      alert('Failed to send reminder: ' + err.message)
    } finally {
      setIsTransitioning(false)
    }
  }

  const toggleUserExpansion = (userId: number) => {
    const newExpanded = new Set(expandedUsers)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedUsers(newExpanded)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleRoleFilter = (role: 'all' | 'user' | 'admin') => {
    setRoleFilter(role)
  }

  if (isLoading && !users.length) {
    return <LoadingSpinner overlay={true} message="Loading users..." />
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Page header with navigation */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <button 
            onClick={() => router.push('/dashboard')}
            className={styles.backButton}
          >
            <FiChevronLeft size={20} />
          </button>
          <h1 className={styles.pageTitle}>Dashboard</h1>
        </div>
        <h2 className={styles.sectionTitle}>User Management</h2>
        <div className={styles.userStats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{filteredUsers.length}</span>
            <span className={styles.statLabel}>Users</span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={styles.filterSection}>
        <div className={styles.searchContainer}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterContainer}>
          <FiFilter className={styles.filterIcon} />
          <select
            value={filterParam || roleFilter}
            onChange={(e) => handleRoleFilter(e.target.value as 'all' | 'user' | 'admin')}
            className={styles.filterSelect}
            disabled={!!filterParam} // Disable if URL filter is active
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👥</div>
          <h3>No Users Found</h3>
          <p>
            {searchQuery || roleFilter !== 'all' 
              ? 'No users match your current filters.' 
              : 'No users registered yet.'
            }
          </p>
        </div>
      ) : (
        <div className={styles.usersList}>
          {filteredUsers.map((userItem) => (
            <div key={userItem.id} className={styles.userCard}>
              {/* User Card Header - Always Visible */}
              <div 
                className={styles.userCardHeader}
                onClick={() => toggleUserExpansion(userItem.id)}
              >
                <div className={styles.userAvatar}>
                  <FiUser />
                </div>
                
                <div className={styles.userBasicInfo}>
                  <h3 className={styles.userName}>{userItem.fullName}</h3>
                  <p className={styles.userEmail}>{userItem.email}</p>
                </div>

                <div className={styles.userRoleBadge}>
                  <span className={`${styles.roleBadge} ${styles[`role${userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}`]}`}>
                    {userItem.role === 'admin' ? <FiShield /> : <FiUser />}
                    {userItem.role}
                  </span>
                </div>

                <div className={styles.expandIcon}>
                  {expandedUsers.has(userItem.id) ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedUsers.has(userItem.id) && (
                <div className={styles.userCardContent}>
                  {/* User Details */}
                  <div className={styles.userDetails}>
                    <div className={styles.detailItem}>
                      <FiCalendar className={styles.detailIcon} />
                      <div className={styles.detailInfo}>
                        <span className={styles.detailLabel}>Joined</span>
                        <span className={styles.detailValue}>
                          {new Date(userItem.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className={styles.detailItem}>
                      <FiShoppingCart className={styles.detailIcon} />
                      <div className={styles.detailInfo}>
                        <span className={styles.detailLabel}>Abandoned Cart</span>
                        <span className={`${styles.detailValue} ${userItem.abandonedCartCount > 0 ? styles.hasItems : ''}`}>
                          {userItem.abandonedCartCount} items
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className={styles.quickActions}>
                    <Link
                      href={`/dashboard/admin/orders?userId=${userItem.id}`}
                      className={styles.actionButton}
                    >
                      View Orders
                    </Link>
                    
                    {userItem.abandonedCartCount > 0 && (
                      <button
                        onClick={() => handleRemindCart(userItem.id)}
                        className={`${styles.actionButton} ${styles.remindButton}`}
                      >
                        <FiMail />
                        Send Reminder
                      </button>
                    )}
                  </div>

                  {/* Admin Controls */}
                  <div className={styles.adminControls}>
                    <div className={styles.roleControl}>
                      <label className={styles.controlLabel}>Role:</label>
                      <select
                        value={userItem.role}
                        onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                        className={styles.roleSelect}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(userItem)}
                      className={styles.deleteButton}
                      title="Delete User"
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(isLoading || isTransitioning) && (
        <LoadingSpinner overlay={true} message={isTransitioning ? "Processing..." : "Loading..."} />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete User"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.fullName}? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete User"
        isProcessing={isDeleting}
        onConfirm={handleDeleteUser}
        onClose={() => {
          if (!isDeleting) {
            setDeleteTarget(null)
          }
        }}
      />
    </div>
  )
}
