'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import styles from '../../mobile-dashboard.module.css'
import { 
  Package, 
  ChevronRight, 
  RefreshCw, 
  PlusCircle, 
  Star, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  DollarSign,
  CircleCheck,
  CircleX,
  BarChart3,
  User,
  LogOut
} from 'lucide-react'

interface Product {
  id: number
  name: string
  slug: string
  price: number
  currency: string
  stockQuantity: number
  isActive: boolean
  categoryId: number | null
}

export default function MobileProductManagement() {
  const { user, token } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Unauthorized')
      setIsLoading(false)
      return
    }

    fetchProducts()
  }, [token, user])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || response.statusText)
      }
      
      const data = await response.json()
      setProducts(data.products)
      setError(null)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete ${name}? This action cannot be undone.`)) return
    
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error)
      }
      
      setProducts(products.filter(p => p.id !== id))
    } catch (error: any) {
      alert('Failed to delete product: ' + error.message)
    }
  }

  function handleEdit(id: number) {
    router.push(`/dashboard/admin/products/${id}`)
  }

  function handleAddNew() {
    router.push('/dashboard/admin/products/new')
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
        Manage Products
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
          Total Products: <span className="text-black">{products.length}</span>
        </div>
        <button 
          onClick={fetchProducts}
          className={isLoading ? `${styles.refreshButton} ${styles.refreshing}` : styles.refreshButton}
          disabled={isLoading}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => window.location.href = '/dashboard/admin/products/new'}
          className="flex items-center justify-center gap-2 bg-black text-white text-sm py-3 px-4 rounded-md w-full"
        >
          <PlusCircle size={16} />
          Add Product
        </button>
        
        <button
          onClick={() => window.location.href = '/dashboard/admin/products/highest-rated'}
          className="flex items-center justify-center gap-2 bg-amber-100 text-amber-800 text-sm py-3 px-4 rounded-md w-full"
        >
          <Star size={16} />
          Top Rated
        </button>
      </div>

      {isLoading ? (
        <div className={styles.emptyState}>
          <RefreshCw className={`${styles.emptyStateIcon} ${styles.refreshing}`} size={24} />
          <p className={styles.emptyStateText}>Loading products...</p>
        </div>
      ) : error ? (
        <div className={styles.emptyState}>
          <AlertTriangle className={styles.emptyStateIcon} size={24} />
          <p className={styles.emptyStateText}>{error}</p>
        </div>
      ) : (
        <ul className={styles.menuList}>
          {products.map(product => (
            <li key={product.id}>
              <div 
                className={styles.menuItem}
                onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
              >
                <div className={styles.menuIcon}>
                  <Package size={18} />
                </div>
                <div className={styles.menuItemText}>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <DollarSign size={10} /> 
                    {product.currency} {product.price?.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {product.isActive ? (
                    <CircleCheck size={16} className="text-green-500" />
                  ) : (
                    <CircleX size={16} className="text-gray-400" />
                  )}
                  <ChevronRight size={20} className={expandedProduct === product.id ? "transform rotate-90" : ""} />
                </div>
              </div>
              
              {expandedProduct === product.id && (
                <div className="bg-gray-50 p-4 rounded-b-lg border-t border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Stock:</span>
                      <span className={`font-medium ${product.stockQuantity <= 5 ? 'text-orange-600' : ''}`}>
                        {product.stockQuantity}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className={`${product.isActive ? 'text-green-600' : 'text-gray-500'} font-medium`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/dashboard/admin/products/${product.id}`}
                      className="flex items-center gap-1 bg-gray-100 text-gray-800 text-sm px-3 py-2 rounded-md flex-1 justify-center"
                    >
                      <Edit size={14} />
                      Edit
                    </Link>
                    
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="flex items-center gap-1 bg-red-100 text-red-800 text-sm px-3 py-2 rounded-md flex-1 justify-center"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                  
                  <Link
                    href={`/dashboard/admin/products/${product.id}`}
                    className="flex items-center justify-center gap-1 bg-black text-white text-sm px-3 py-2 rounded-md w-full"
                  >
                    <BarChart3 size={14} />
                    View Details
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 