// File: app/dashboard/admin/products/new/page.tsx

'use client'

import { useState, FormEvent, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../contexts/AuthContext'
import styles from './new-product.module.css'
import { FiBox, FiDollarSign, FiImage, FiSave, FiX, FiArrowRight, FiCheck, FiAlertCircle, FiUpload } from 'react-icons/fi'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import { useDropzone } from 'react-dropzone'

export default function NewProductPage() {
  const { token, user } = useAuth()
  const router = useRouter()
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success')
  const [isLoading, setIsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [description, setDescription] = useState('')
  const [specifications, setSpecifications] = useState('')
  const [careInstructions, setCareInstructions] = useState('')
  const [stylingIdeas, setStylingIdeas] = useState<{ url: string; text: string }[]>([])
  const [price, setPrice] = useState<number>(0)
  const [currency, setCurrency] = useState('INR')
  const [stockQuantity, setStockQuantity] = useState<number>(0)
  const [isActive, setIsActive] = useState(true)
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [fileInputs, setFileInputs] = useState<number[]>([0])
  const [stylingFileInputs, setStylingFileInputs] = useState<number[]>([0])
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({})
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({})
  const [usageTags, setUsageTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [newTagInput, setNewTagInput] = useState('')

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Unauthorized')
      return
    }
    fetch('/api/categories')
      .then(r => r.json())
      .then(json => setCategories(json.categories))
    // Fetch existing tags for suggestions
    fetch('/api/products/usage-tags')
      .then(r => r.json())
      .then(json => {
        if (Array.isArray(json.tags)) setAvailableTags(json.tags)
      })
      .catch(console.error)
  }, [user])

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls(prev => prev.filter((_, index) => index !== indexToRemove))
    setFileInputs(prev => prev.filter(idx => idx !== indexToRemove))
  }

  const handleRemoveStylingImage = (indexToRemove: number) => {
    setStylingIdeas(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const uploadId = file.name + Date.now()
      setUploadingFiles(prev => ({ ...prev, [uploadId]: true }))
      setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }))

      const form = new FormData()
      form.append('file', file)
      
      try {
        const xhr = new XMLHttpRequest()
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total)
            setUploadProgress(prev => ({ ...prev, [uploadId]: progress }))
          }
        }

        // Create a Promise to handle the XHR request
        const uploadPromise = new Promise((resolve, reject) => {
          xhr.onload = async () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText)
              resolve(response.url)
            } else {
              reject(new Error('Upload failed'))
            }
          }
          xhr.onerror = () => reject(new Error('Upload failed'))
        })

        xhr.open('POST', `/api/uploads?filename=${file.name}`)
        xhr.send(file)

        const url = await uploadPromise
        setImageUrls(prev => [...prev, (url as any).url])
        
        // Clear progress and errors for this upload
        setUploadingFiles(prev => {
          const newUploading = { ...prev }
          delete newUploading[uploadId]
          return newUploading
        })
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[uploadId]
          return newProgress
        })
      } catch (error) {
        setUploadErrors(prev => ({
          ...prev,
          [uploadId]: 'Failed to upload image'
        }))
        setUploadingFiles(prev => {
          const newUploading = { ...prev }
          delete newUploading[uploadId]
          return newUploading
        })
      }
    }
  }, [])

  const onDropStyling = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      try {
        const res = await fetch(`/api/uploads?filename=${file.name}`, {
          method: 'POST',
          body: file,
        })
        const data = await res.json()
        setStylingIdeas(prev => [...prev, { url: data.url, text: '' }])
      } catch (err) {
        console.error('Upload failed', err)
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 5 - imageUrls.length,
  })

  const { getRootProps: getStylingRootProps, getInputProps: getStylingInputProps, isDragActive: isStylingDrag } = useDropzone({
    onDrop: onDropStyling,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
  })

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

  function handleCancelClick(e: React.MouseEvent) {
    e.preventDefault()
    setIsSaving(true)
    router.push('/dashboard/admin/products')
  }

  if (isLoading || isSaving) return <LoadingSpinner />
  if (error) return <div className={styles.error}>{error}</div>

  return (
    <main className={styles.container}>
      {showNotification && (
        <div className={`${styles.notification} ${styles[notificationType]}`}>
          {notificationType === 'success' ? (
            <FiCheck className={styles.notificationIcon} />
          ) : (
            <FiAlertCircle className={styles.notificationIcon} />
          )}
          {notificationMessage}
        </div>
      )}

      <div className={styles.header}>
        <h1 className={styles.title}>Create New Product</h1>
        <p className={styles.subtitle}>Add product information, pricing, inventory and images</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>
            <FiBox className={styles.sectionIcon} />
            Basic Information
          </h2>
          <div className={styles.formGroup}>
            <label className={styles.label}>Product Name</label>
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
            <label className={styles.label}>Slug</label>
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
              placeholder="Brief description for product listings"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Full Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={styles.textarea}
              placeholder="Detailed product description"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Specifications</label>
            <textarea
              value={specifications}
              onChange={e => setSpecifications(e.target.value)}
              className={styles.textarea}
              placeholder="Add specifications (e.g., material, dimensions)"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Care & Maintenance</label>
            <textarea
              value={careInstructions}
              onChange={e => setCareInstructions(e.target.value)}
              className={styles.textarea}
              placeholder="Care and maintenance instructions"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Purpose / Mood Tags</label>
            <div className={styles.tagOptions} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {availableTags.map(tag => (
                <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <input
                    type="checkbox"
                    checked={usageTags.includes(tag)}
                    onChange={e => {
                      setUsageTags(prev => e.target.checked ? [...prev, tag] : prev.filter(t => t !== tag))
                    }}
                  />
                  {tag}
                </label>
              ))}
            </div>
            <input
              type="text"
              value={newTagInput}
              onChange={e => setNewTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const val = newTagInput.trim()
                  if (val && !usageTags.includes(val)) {
                    setUsageTags(prev => [...prev, val])
                  }
                  if (val && !availableTags.includes(val)) {
                    setAvailableTags(prev => [...prev, val])
                  }
                  setNewTagInput('')
                }
              }}
              className={styles.input}
              placeholder="Add new tag and press Enter"
            />
            {usageTags.length > 0 && (
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {usageTags.map(tag => (
                  <span key={tag} style={{ background: '#eee', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setUsageTags(prev => prev.filter(t => t !== tag))}>
                    {tag} ✕
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>
            <FiDollarSign className={styles.sectionIcon} />
            Pricing & Inventory
          </h2>
          <div className={styles.formGroup}>
            <label className={styles.label}>Category</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className={styles.select}
              required
            >
              <option value="">Select a category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Price</label>
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
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Stock Quantity</label>
              <input
                type="number"
                value={stockQuantity}
                onChange={e => setStockQuantity(parseInt(e.target.value))}
                className={styles.input}
                min="0"
                placeholder="Available quantity"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span className={styles.checkboxLabel}>Product Active</span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>
            <FiImage className={styles.sectionIcon} />
            Product Images
          </h2>
          <div className={styles.formGroup}>
            <label className={styles.label}>Product Images</label>
            
            <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.dropzoneDragActive : ''}`}>
              <input {...getInputProps()} />
              <FiUpload className={styles.dropzoneIcon} />
              <p className={styles.dropzoneText}>
                {isDragActive
                  ? 'Drop the images here...'
                  : 'Drag & drop product images here, or click to select files'}
              </p>
              <p className={styles.dropzoneText}>
                {imageUrls.length === 5 
                  ? 'Maximum number of images reached'
                  : `${5 - imageUrls.length} images remaining`}
              </p>
            </div>

            <div className={styles.imageGrid}>
              {imageUrls.map((url, i) => (
                <div key={i} className={styles.imagePreviewContainer}>
                  <img
                    src={url}
                    alt={`Product preview ${i + 1}`}
                    className={styles.imagePreview}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className={styles.removeImageButton}
                    title="Remove image"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
              
              {/* Show uploading files with progress */}
              {Object.entries(uploadingFiles).map(([uploadId, isUploading]) => (
                <div key={uploadId} className={styles.imagePreviewContainer}>
                  <div className={styles.uploadingOverlay}>
                    <FiUpload className={styles.uploadingIcon} />
                    <div className={styles.uploadProgress}>
                      <div 
                        className={styles.uploadProgressBar} 
                        style={{ width: `${uploadProgress[uploadId] || 0}%` }}
                      />
                    </div>
                    <div className={styles.uploadProgressText}>
                      {uploadProgress[uploadId] || 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {Object.entries(uploadErrors).map(([uploadId, error]) => (
              <p key={uploadId} className={styles.uploadError}>
                {error}
              </p>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>
            <FiImage className={styles.sectionIcon} />
            Artful Styling Ideas Images
          </h2>
          <div className={styles.formGroup}>
            <label className={styles.label}>Styling Inspiration Images</label>
            
            <div {...getStylingRootProps()} className={`${styles.dropzone} ${isStylingDrag ? styles.dropzoneDragActive : ''}`}>
              <input {...getStylingInputProps()} />
              <FiUpload className={styles.dropzoneIcon} />
              <p className={styles.dropzoneText}>
                {isStylingDrag
                  ? 'Drop the images here...'
                  : 'Drag & drop styling inspiration images here, or click to select files'}
              </p>
              <button type="button" className={styles.browseButton}>
                <FiUpload />
                Browse Files
              </button>
            </div>

            {stylingIdeas.length > 0 && (
              <div className={styles.imagePreviewGrid}>
                {stylingIdeas.map((idea, idx) => (
                  <div key={idea.url} className={styles.previewItem}>
                    <img src={idea.url} alt="styling idea" className={styles.previewImg} />
                    <input
                      type="text"
                      value={idea.text}
                      onChange={e => {
                        const val = e.target.value
                        setStylingIdeas(prev => prev.map((it,i)=> i===idx ? { ...it, text: val } : it))
                      }}
                      placeholder="Add a caption for this styling idea"
                      className={styles.stylingCaptionInput}
                    />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveStylingImage(idx)} 
                      className={styles.removeBtn}
                    >
                      <FiX />
                      Remove Image
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button 
            type="submit" 
            className={styles.saveButton}
            disabled={submitting}
          >
            <FiSave />
            {submitting ? 'Creating...' : 'Create Product'}
            <FiArrowRight className={styles.arrowIcon} />
          </button>
          <button 
            onClick={handleCancelClick} 
            className={styles.cancelButton}
            disabled={submitting}
          >
            <FiX />
            Cancel
            <FiArrowRight className={styles.arrowIcon} />
          </button>
        </div>
      </form>
    </main>
  )
}