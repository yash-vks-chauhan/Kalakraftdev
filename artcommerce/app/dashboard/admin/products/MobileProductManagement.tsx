'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '../../../components/LoadingSpinner'
import styles from '../../mobile-dashboard.module.css'
import desktopStyles from './products-list.module.css'
import { 
  Package, 
  ChevronRight, 
  ChevronLeft,
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
  X,
  MoreVertical
} from 'lucide-react'

interface Product {
  id: number
  name: string
  slug: string
  price: number
  currency: string
  stockQuantity: number
  imageUrls: string[]
  shortDesc: string
  isActive: boolean
  categoryId: number | null
  totalSold: number
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
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [productsPerPage, setProductsPerPage] = useState(10)
  const [isPageTransitioning, setIsPageTransitioning] = useState(false)
  
  // Refs for toggle buttons
  const activeButtonRef = useRef<HTMLButtonElement>(null);
  const inactiveButtonRef = useRef<HTMLButtonElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Close actions menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch products on mount
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
  }, [allProducts, activeFilter, currentPage])

  const filterProducts = () => {
    if (allProducts.length === 0) return;
    
    const filtered = allProducts.filter(p => activeFilter === 'active' ? p.isActive : !p.isActive);
    setTotalProducts(filtered.length);
    
    // Apply pagination
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = filtered.slice(startIndex, endIndex);
    
    setDisplayProducts(paginatedProducts);
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

  // Toggle product active/inactive status with optimistic UI update
  async function handleToggleStatus(id: number, newStatus: boolean) {
    // Optimistically update UI
    setAllProducts(products => products.map(p => p.id === id ? { ...p, isActive: newStatus } : p))
    
    // Add animation class to the expanded content
    const expandedContent = document.querySelector(`[data-product-id="${id}"] .${styles.expandableContent}`);
    if (expandedContent) {
      expandedContent.classList.add(styles.statusChanging);
      
      // Remove the class after animation completes
      setTimeout(() => {
        expandedContent?.classList.remove(styles.statusChanging);
      }, 500);
    }
    
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
      // Already updated UI optimistically
    } catch (err: any) {
      // Revert UI on failure
      setAllProducts(products => products.map(p => p.id === id ? { ...p, isActive: !newStatus } : p))
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
    setCurrentPage(1); // Reset to first page when changing filter
  };

  // Pagination handlers
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setIsPageTransitioning(true);
      setExpandedProduct(null); // Close any expanded items
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setIsPageTransitioning(false);
      }, 150);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setIsPageTransitioning(true);
      setExpandedProduct(null); // Close any expanded items
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsPageTransitioning(false);
      }, 150);
    }
  };
  
  const handlePageSelect = (page: number) => {
    if (page !== currentPage) {
      setIsPageTransitioning(true);
      setExpandedProduct(null); // Close any expanded items
      setTimeout(() => {
        setCurrentPage(page);
        setIsPageTransitioning(false);
      }, 150);
    }
  };
  
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setProductsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    setExpandedProduct(null);
  };

  if (user?.role !== 'admin') {
    return <p className="p-4 text-red-500">Unauthorized</p>
  }

  if (isLoading || isTransitioning) {
    return <LoadingSpinner overlay={true} message={isTransitioning ? 'Navigating...' : 'Loading products...'} />
  }

  return (
    <div className={styles.mobileDashboardContainer}>
      <header className={styles.mobileHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <h1 className={styles.headerTitle}>Products</h1>
            <p className={styles.headerSubtitle}>Manage your product catalog</p>
          </div>
          <div className={styles.headerActions}>
            <button 
              onClick={handleLogout}
              className={`${styles.iconButton} ${showLogoutConfirm ? "text-red-500" : ""}`}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.contentWrapper}>
        <div className={styles.userProfile}>
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`${user.fullName}'s avatar`}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatar}>
              <User size={24} />
            </div>
          )}
          <div className={styles.userInfo}>
            <h2 className={styles.userName}>{user.fullName}</h2>
            <p className={styles.userRole}>{user.role}</p>
          </div>
        </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {totalProducts} Products
          </h3>
          <p className="text-sm text-gray-500">
            {activeFilter === 'active' ? 'Active products' : 'Inactive products'}
            {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchProducts}
            className={styles.iconButton}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          
          <div className="relative" ref={actionsMenuRef}>
            <button 
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className={styles.iconButton}
              aria-label="More actions"
            >
              <MoreVertical size={18} />
            </button>
            
            {showActionsMenu && (
              <div className={styles.actionMenuDropdown}>
                <Link
                  href="/dashboard/admin/products/new"
                  className={styles.actionMenuItem}
                  onClick={() => setShowActionsMenu(false)}
                >
                  <PlusCircle size={16} />
                  <span>Add New Product</span>
                </Link>
                <Link
                  href="/dashboard/admin/products/highest-rated"
                  className={styles.actionMenuItem}
                  onClick={() => setShowActionsMenu(false)}
                >
                  <Star size={16} />
                  <span>Highest Rated</span>
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.segmentedControl}>
          <button 
            ref={activeButtonRef}
            type="button"
            onClick={() => handleFilterChange('active')}
            className={`${styles.segment} ${activeFilter === 'active' ? styles.active : ''}`}
          >
            <CircleCheck size={14} style={{ marginRight: '6px' }} />
            Active ({allProducts.filter(p => p.isActive).length})
          </button>
          <button 
            ref={inactiveButtonRef}
            type="button"
            onClick={() => handleFilterChange('inactive')}
            className={`${styles.segment} ${activeFilter === 'inactive' ? styles.active : ''}`}
          >
            <CircleX size={14} style={{ marginRight: '6px' }} />
            Inactive ({allProducts.filter(p => !p.isActive).length})
          </button>
        </div>

      {isLoading ? (
        <div className={styles.emptyState}>
          <LoadingSpinner size="small" message="Loading products..." />
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
        <>
          <div className={`${styles.modernProductGrid} ${isPageTransitioning ? styles.paginationTransition : ''}`}>
            {displayProducts.map(product => (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.productImageContainer}>
                  {product.imageUrls && product.imageUrls.length > 0 ? (
                    <img 
                      src={product.imageUrls[0]} 
                      alt={product.name}
                      className={styles.productCardImage}
                    />
                  ) : (
                    <div className={styles.productPlaceholder}>
                      <Package size={24} />
                    </div>
                  )}
                  <div className={styles.productBadge}>
                    {product.isActive ? (
                      <span className={styles.activeBadge}>Active</span>
                    ) : (
                      <span className={styles.inactiveBadge}>Inactive</span>
                    )}
                  </div>
                </div>
                
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{product.name}</h3>
                  <p className={styles.productPrice}>{product.currency} {product.price?.toFixed(2)}</p>
                  <div className={styles.productMeta}>
                    <span className={styles.productStock}>
                      Stock: {product.stockQuantity}
                    </span>
                    <span className={styles.productSold}>
                      Sold: {product.totalSold || 0}
                    </span>
                  </div>
                  
                  <div className={styles.productActions}>
                    <Link
                      href={`/dashboard/admin/products/${product.id}`}
                      className={styles.quickAction}
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(product.id, !product.isActive)}
                      className={styles.quickAction}
                    >
                      {product.isActive ? <CircleX size={16} /> : <CircleCheck size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className={`${styles.quickAction} ${styles.deleteAction}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <div className={styles.paginationInfo}>
                <div className={styles.paginationInfoText}>
                  Showing {((currentPage - 1) * productsPerPage) + 1} to {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts}
                </div>
                <div className={styles.paginationInfoText}>
                  Page {currentPage} of {totalPages}
                </div>
              </div>
              
              <div className={styles.paginationControls}>
                {/* Previous Button */}
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={styles.paginationButton}
                >
                  <ChevronRight size={16} className="rotate-180" />
                  Previous
                </button>
                
                {/* Page Numbers - show first, last, current and nearby pages */}
                <div className={styles.paginationNumbers}>
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => handlePageSelect(1)}
                        className={styles.pageNumber}
                      >
                        1
                      </button>
                      {currentPage > 4 && <span className={styles.paginationDots}>...</span>}
                    </>
                  )}
                  
                  {/* Current page and nearby pages */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum <= totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageSelect(pageNum)}
                          className={`${styles.pageNumber} ${pageNum === currentPage ? styles.active : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                  
                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className={styles.paginationDots}>...</span>}
                      <button
                        onClick={() => handlePageSelect(totalPages)}
                        className={styles.pageNumber}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                {/* Next Button */}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={styles.paginationButton}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
      </div> {/* Close contentWrapper */}
    </div> {/* Close mobileDashboardContainer */}
  )
} 