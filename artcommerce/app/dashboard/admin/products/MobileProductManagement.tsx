'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import styles from '../../mobile-dashboard.module.css'
import desktopStyles from './products-list.module.css'
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
  LogOut,
  ArrowRight,
  Check,
  X
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
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [displayProducts, setDisplayProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive'>('active')
  
  // Refs for toggle buttons
  const activeButtonRef = useRef<HTMLButtonElement>(null);
  const inactiveButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Unauthorized')
      setIsLoading(false)
      return
    }

    fetchProducts()
  }, [token, user])

  useEffect(() => {
    filterProducts()
  }, [allProducts, activeFilter])

  const filterProducts = () => {
    if (allProducts.length === 0) return;
    
    const filtered = allProducts.filter(p => activeFilter === 'active' ? p.isActive : !p.isActive);
    setDisplayProducts(filtered);
  }

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
      setAllProducts(data.products)
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
      
      setAllProducts(products => products.filter(p => p.id !== id))
    } catch (error: any) {
      alert('Failed to delete product: ' + error.message)
    }
  }

  // Toggle product active/inactive status
  async function handleToggleStatus(id: number, newStatus: boolean) {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: newStatus })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error updating product status')
      }
      const json = await res.json()
      setAllProducts(products => products.map(p => p.id === id ? { ...p, isActive: json.product.isActive } : p))
    } catch (err: any) {
      alert('Failed to update product status: ' + err.message)
    }
  }

  function handleEdit(id: number) {
    router.push(`/dashboard/admin/products/${id}`)
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

  const handleFilterChange = (filter: 'active' | 'inactive') => {
    setExpandedProduct(null);
    setActiveFilter(filter);
  };

  if (user?.role !== 'admin') {
    return <p className="p-4 text-red-500">Unauthorized</p>
  }

  if (isLoading || isTransitioning) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <RefreshCw className="animate-spin h-8 w-8 text-gray-800 mb-4" />
        <p className="text-gray-600 text-sm">
          {isTransitioning ? 'Navigating...' : 'Loading products...'}
        </p>
      </div>
    );
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

      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-500">
            {activeFilter === 'active' ? 'Active Products' : 'Inactive Products'}: <span className="text-black">{displayProducts.length}</span>
            <span className="text-xs text-gray-400 ml-1">of {allProducts.length}</span>
          </div>
          <button 
            onClick={fetchProducts}
            className={isLoading ? `${styles.refreshButton} ${styles.refreshing}` : styles.refreshButton}
            disabled={isLoading}
          >
            <RefreshCw size={16} />
          </button>
        </div>
        
        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200">
          <span className="text-sm font-medium ml-2 text-gray-600">Show:</span>
          <div className="flex items-center bg-white rounded-full p-1 shadow-sm">
            <button 
              ref={activeButtonRef}
              type="button"
              onClick={() => handleFilterChange('active')}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-300 flex items-center gap-1 ${
                activeFilter === 'active' 
                  ? 'bg-green-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CircleCheck size={14} className={activeFilter === 'active' ? 'text-white' : 'text-green-500'} />
              Active
            </button>
            <button 
              ref={inactiveButtonRef}
              type="button"
              onClick={() => handleFilterChange('inactive')}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-300 flex items-center gap-1 ${
                activeFilter === 'inactive' 
                  ? 'bg-gray-700 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CircleX size={14} className={activeFilter === 'inactive' ? 'text-white' : 'text-gray-400'} />
              Inactive
            </button>
          </div>
        </div>
      </div>

      <div className={styles.mobileButtonsContainer}>
        <Link
          href="/dashboard/admin/products/new"
          className={styles.mobileActionButton}
          style={{ touchAction: 'manipulation' }}
        >
          + Add New Product
          <ArrowRight size={14} className={styles.mobileArrowIcon} />
        </Link>
        <Link
          href="/dashboard/admin/products/highest-rated"
          className={styles.mobileActionButton}
          style={{ touchAction: 'manipulation' }}
        >
          ⭐ Highest Rated
          <ArrowRight size={14} className={styles.mobileArrowIcon} />
        </Link>
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
      ) : displayProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <Package className={styles.emptyStateIcon} size={24} />
          <p className={styles.emptyStateText}>No {activeFilter} products found</p>
        </div>
      ) : (
        <ul className={styles.menuList}>
          {displayProducts.map(product => (
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
                  <ChevronRight 
                    size={20} 
                    className={`transform transition-transform duration-300 ${expandedProduct === product.id ? "rotate-90" : ""}`} 
                  />
                </div>
              </div>
              
              <div className={`${styles.expandableContent} ${expandedProduct === product.id ? styles.expanded : ''} bg-gray-50 rounded-b-lg border-t border-gray-100`}>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Stock:</span>
                      <span className={`font-medium ${product.stockQuantity <= 5 ? 'text-orange-600' : ''}`}>
                        {product.stockQuantity}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Status:</span>
                      <label className={desktopStyles.statusSwitch} onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={product.isActive}
                          onChange={() => handleToggleStatus(product.id, !product.isActive)}
                        />
                        <span className={desktopStyles.statusSlider} />
                      </label>
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
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(product.id, product.name)
                      }}
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 