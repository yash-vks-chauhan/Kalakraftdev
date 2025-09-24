'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../../contexts/AuthContext'
import styles from './mobile-new-product.module.css'
import LoadingSpinner from '../../../../../components/LoadingSpinner'

export default function MobileNewProductPage() {
  const { token, user } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [description, setDescription] = useState('')
  const [specifications, setSpecifications] = useState('')
  const [careInstructions, setCareInstructions] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [currency, setCurrency] = useState('INR')
  const [stockQuantity, setStockQuantity] = useState<number>(0)
  const [isActive, setIsActive] = useState(true)
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Unauthorized')
      return
    }
    fetch('/api/categories')
      .then(r => r.json())
      .then(json => setCategories(json.categories))
      .catch(console.error)
  }, [user])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    
    try {
      if (!name || !slug) {
        throw new Error('Name and slug are required')
      }

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          slug,
          shortDesc,
          description,
          specifications,
          careInstructions,
          price,
          currency,
          stockQuantity,
          isActive,
          categoryId: categoryId ? Number(categoryId) : null,
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create product')
      }

      // Success - redirect to products list
      router.push('/dashboard/admin/products')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    router.push('/dashboard/admin/products')
  }

  if (error === 'Unauthorized') {
    return <div className={styles.error}>Unauthorized</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Create New Product</h1>
        <p className={styles.subtitle}>Add basic product information</p>
      </div>

      {error && (
        <div className={styles.error} style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Basic Information</h2>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Product Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={styles.input}
              placeholder="Enter product name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className={styles.input}
              placeholder="product-url-slug"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Short Description</label>
            <input
              type="text"
              value={shortDesc}
              onChange={e => setShortDesc(e.target.value)}
              className={styles.input}
              placeholder="Brief description"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Full Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={styles.textarea}
              placeholder="Detailed product description"
              rows={4}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Specifications</label>
            <textarea
              value={specifications}
              onChange={e => setSpecifications(e.target.value)}
              className={styles.textarea}
              placeholder="Material, dimensions, etc."
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Care Instructions</label>
            <textarea
              value={careInstructions}
              onChange={e => setCareInstructions(e.target.value)}
              className={styles.textarea}
              placeholder="Care and maintenance"
              rows={3}
            />
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Pricing & Inventory</h2>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Category *</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className={styles.select}
              required
            >
              <option value="">Select category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Price *</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(parseFloat(e.target.value))}
                className={styles.input}
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className={styles.select}
                required
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Stock Quantity</label>
              <input
                type="number"
                value={stockQuantity}
                onChange={e => setStockQuantity(parseInt(e.target.value))}
                className={styles.input}
                min="0"
                placeholder="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxWrapper}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxLabel}>Product Active</span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button 
            type="button"
            onClick={handleCancel}
            className={styles.cancelButton}
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>

      {submitting && <LoadingSpinner overlay={true} message="Creating product..." />}
    </div>
  )
}

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 5 - imageUrls.length,
    maxSize: 20 * 1024 * 1024, // 20MB in bytes
    multiple: true,
  })

  const { getRootProps: getStylingRootProps, getInputProps: getStylingInputProps, isDragActive: isStylingDrag } = useDropzone({
    onDrop: onDropStyling,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 20 * 1024 * 1024, // 20MB in bytes
    multiple: true,
  })

  // Handle file rejections from dropzone
  useEffect(() => {
    if (fileRejections.length > 0) {
      fileRejections.forEach(({ file, errors }) => {
        errors.forEach(error => {
          if (error.code === 'file-too-large') {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            setNotificationMessage(`File ${file.name} exceeds the 20MB size limit (size: ${fileSizeMB}MB)`);
            setNotificationType('error');
            setShowNotification(true);
          } else if (error.code === 'too-many-files') {
            setNotificationMessage(`Too many files selected. You can upload a maximum of ${5 - imageUrls.length} more images.`);
            setNotificationType('error');
            setShowNotification(true);
          } else {
            setNotificationMessage(`Error with file ${file.name}: ${error.message}`);
            setNotificationType('error');
            setShowNotification(true);
          }
        });
      });
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  }, [fileRejections, imageUrls.length, setNotificationMessage, setNotificationType, setShowNotification]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (!name || !slug) throw new Error('Name and slug are required')
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          slug,
          shortDesc,
          description,
          specifications,
          careInstructions,
          stylingIdeaImages: stylingIdeas,
          price,
          currency,
          stockQuantity,
          isActive,
          categoryId: categoryId ? Number(categoryId) : null,
          imageUrls,
          usageTags,
        })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create')
      }
      setNotificationType('success')
      setNotificationMessage('Product created successfully')
      setShowNotification(true)
      setTimeout(() => {
        setIsSaving(true) // Show loading spinner for transition
        router.push('/dashboard/admin/products')
      }, 1500)
    } catch (err: any) {
      setNotificationType('error')
      setNotificationMessage(err.message)
      setShowNotification(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Create New Product</h1>
        <p className={styles.subtitle}>Add basic product information</p>
      </div>

      {error && (
        <div className={styles.error} style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Basic Information</h2>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Product Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={styles.input}
              placeholder="Enter product name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className={styles.input}
              placeholder="product-url-slug"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Short Description</label>
            <input
              type="text"
              value={shortDesc}
              onChange={e => setShortDesc(e.target.value)}
              className={styles.input}
              placeholder="Brief description"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Full Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={styles.textarea}
              placeholder="Detailed product description"
              rows={4}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Specifications</label>
            <textarea
              value={specifications}
              onChange={e => setSpecifications(e.target.value)}
              className={styles.textarea}
              placeholder="Material, dimensions, etc."
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Care Instructions</label>
            <textarea
              value={careInstructions}
              onChange={e => setCareInstructions(e.target.value)}
              className={styles.textarea}
              placeholder="Care and maintenance"
              rows={3}
            />
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Pricing & Inventory</h2>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Category *</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className={styles.select}
              required
            >
              <option value="">Select category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Price *</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(parseFloat(e.target.value))}
                className={styles.input}
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className={styles.select}
                required
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Stock Quantity</label>
              <input
                type="number"
                value={stockQuantity}
                onChange={e => setStockQuantity(parseInt(e.target.value))}
                className={styles.input}
                min="0"
                placeholder="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxWrapper}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxLabel}>Product Active</span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button 
            type="button"
            onClick={handleCancel}
            className={styles.cancelButton}
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>

      {submitting && <LoadingSpinner overlay={true} message="Creating product..." />}
    </div>
  )
}
