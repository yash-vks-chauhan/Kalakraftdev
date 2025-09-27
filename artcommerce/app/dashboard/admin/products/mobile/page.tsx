'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../../contexts/AuthContext'
import styles from './mobile-products.module.css'
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiFilter, FiEye, FiEyeOff } from 'react-icons/fi'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { getOptimizedImageUrl } from '../../../../../lib/cloudinaryImages'

interface Product {
  id: number
  name: string
  slug: string
  price: number
  currency: string
  stockQuantity: number
  isActive: boolean
  categoryId: number | null
  totalSold: number
  imageUrls: string[]
  shortDesc: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalProducts: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function MobileAdminProductsPage() {
  const { user, token } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const router = useRouter()

  const PRODUCTS_PER_PAGE = 10

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Unauthorized')
      setIsLoading(false)
      return
    }

    fetchProducts()
  }, [token, user, currentPage, searchQuery, statusFilter])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: PRODUCTS_PER_PAGE.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await fetch(`/api/admin/products/paginated?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error((await response.json()).error || response.statusText)
      }

      const data = await response.json()
      setProducts(data.products)
      setPagination(data.pagination)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
    setIsTransitioning(true)
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error((await res.json()).error)
      
      // Refresh the current page
      await fetchProducts()
    } catch (err: any) {
      alert('Failed to delete product: ' + err.message)
    } finally {
      setIsTransitioning(false)
    }
  }

  const handleToggleStatus = async (id: number, newStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: newStatus })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const json = await res.json()
      setProducts(products.map(p => p.id === id ? { ...p, isActive: json.product.isActive } : p))
    } catch (err: any) {
      alert('Failed to update product status: ' + err.message)
    }
  }

  const handleEdit = (id: number) => {
    setIsTransitioning(true)
    router.push(`/dashboard/admin/products/${id}`)
  }

  const handleAddNew = () => {
    setIsTransitioning(true)
    router.push('/dashboard/admin/products/new')
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleStatusFilter = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status)
    setCurrentPage(1) // Reset to first page when filtering
  }

  const getProductImage = (product: Product) => {
    if (product.imageUrls && product.imageUrls.length > 0) {
      return getOptimizedImageUrl(product.imageUrls[0], 'c_fill,w_300,h_300,q_auto')
    }
    return '/images/placeholder-product.png'
  }

  if (isLoading && !products.length) {
    return <LoadingSpinner overlay={true} message="Loading products..." />
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
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Products</h1>
          <button onClick={handleAddNew} className={styles.addButton}>
            <FiPlus />
          </button>
        </div>
        <p className={styles.subtitle}>
          {pagination.totalProducts} product{pagination.totalProducts !== 1 ? 's' : ''} total
        </p>
      </div>

      {/* Search and Filter */}
      <div className={styles.filterSection}>
        <div className={styles.searchContainer}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterContainer}>
          <FiFilter className={styles.filterIcon} />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <h3>No Products Found</h3>
          <p>
            {searchQuery || statusFilter !== 'all' 
              ? 'No products match your current filters.' 
              : 'Start by adding your first product.'
            }
          </p>
          <button onClick={handleAddNew} className={styles.emptyActionButton}>
            <FiPlus />
            Add Product
          </button>
        </div>
      ) : (
        <>
          <div className={styles.productsGrid}>
            {products.map((product) => (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.productImageContainer}>
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className={styles.productImage}
                    loading="lazy"
                  />
                  <div className={styles.statusBadge}>
                    {product.isActive ? (
                      <span className={styles.activeStatus}>
                        <FiEye />
                        Active
                      </span>
                    ) : (
                      <span className={styles.inactiveStatus}>
                        <FiEyeOff />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{product.name}</h3>
                  <p className={styles.productDesc}>{product.shortDesc}</p>
                  
                  <div className={styles.productMeta}>
                    <div className={styles.priceContainer}>
                      <span className={styles.currency}>{product.currency}</span>
                      <span className={styles.price}>{product.price.toFixed(2)}</span>
                    </div>
                    <div className={styles.stockInfo}>
                      <span className={styles.stockLabel}>Stock:</span>
                      <span className={`${styles.stockValue} ${product.stockQuantity <= 5 ? styles.lowStock : ''}`}>
                        {product.stockQuantity}
                      </span>
                    </div>
                  </div>

                  <div className={styles.salesInfo}>
                    <span className={styles.salesLabel}>Sold:</span>
                    <span className={styles.salesValue}>{product.totalSold}</span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button
                    onClick={() => handleEdit(product.id)}
                    className={styles.editAction}
                    title="Edit Product"
                  >
                    <FiEdit2 />
                  </button>
                  
                  <label className={styles.statusToggle} title="Toggle Active Status">
                    <input
                      type="checkbox"
                      checked={product.isActive}
                      onChange={() => handleToggleStatus(product.id, !product.isActive)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>

                  <button
                    onClick={() => handleDelete(product.id)}
                    className={styles.deleteAction}
                    title="Delete Product"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              
              <div className={styles.paginationControls}>
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={styles.pageButton}
                >
                  Previous
                </button>
                
                <div className={styles.pageNumbers}>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number
                    
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = pagination.currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`${styles.pageNumber} ${
                          pageNum === pagination.currentPage ? styles.currentPage : ''
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className={styles.pageButton}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {(isLoading || isTransitioning) && (
        <LoadingSpinner overlay={true} message={isTransitioning ? "Navigating..." : "Loading..."} />
      )}
    </div>
  )
}
