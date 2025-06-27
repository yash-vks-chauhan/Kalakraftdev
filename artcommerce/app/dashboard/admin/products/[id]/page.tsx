// File: app/dashboard/admin/products/[id]/page.tsx

'use client'

import { useState, useEffect, FormEvent, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '../../../../contexts/AuthContext'
import Link from 'next/link'
import styles from './edit-product.module.css'
import { FiBox, FiDollarSign, FiImage, FiSave, FiX, FiArrowRight, FiCheck, FiAlertCircle, FiUpload } from 'react-icons/fi'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import { useDropzone } from 'react-dropzone'

interface Product {
  id: number
  name: string
  slug: string
  shortDesc: string
  description: string
  price: number
  currency: string
  stockQuantity: number
  isActive: boolean
  categoryId: number | null
  imageUrls: string[]
}

export default function EditProductPage() {
  const { id } = useParams()
  const { token, user } = useAuth()
  const router = useRouter()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // form state
  const [name, setName] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [description, setDescription] = useState('')
  const [specifications, setSpecifications] = useState('')
  const [careInstructions, setCareInstructions] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [currency, setCurrency] = useState('INR')
  const [stockQuantity, setStockQuantity] = useState<number>(0)
  const [isActive, setIsActive] = useState(true)
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [fileInputs, setFileInputs] = useState<number[]>([0])
  const [stylingFileInputs, setStylingFileInputs] = useState<number[]>([0])
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])

  // Add submitting state to disable form
  const [submitting, setSubmitting] = useState(false)

  // Add this after the existing state declarations
  const [uploadingFiles, setUploadingFiles] = useState<{
    [key: string]: {
      name: string;
      size: number;
      progress: number;
      status: 'uploading' | 'completed' | 'error';
      url?: string;
      preview?: string;
    }
  }>({})

  type StylingIdea = { url: string; text: string }
  const [stylingIdeas, setStylingIdeas] = useState<StylingIdea[]>([])
  const [usageTagsInput, setUsageTagsInput] = useState('')
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(json => setCategories(json.categories))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Unauthorized')
      setIsLoading(false)
      return
    }
    fetch(`/api/admin/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) throw new Error('Product not found')
        return r.json()
      })
      .then(json => {
        const p = json.product as Product
        setProduct(p)
        setName(p.name)
        setShortDesc(p.shortDesc)
        setDescription(p.description)
        setSpecifications((p as any).specifications || '')
        setCareInstructions((p as any).careInstructions || '')
        const ideas = ((p as any).stylingIdeaImages || []).map((it: any) => typeof it === 'string' ? { url: it, text: '' } : it)
        setStylingIdeas(ideas)
        setPrice(p.price)
        setCurrency(p.currency)
        setStockQuantity(p.stockQuantity)
        setIsActive(p.isActive)
        setCategoryId(p.categoryId ?? '')
        setImageUrls(p.imageUrls)
        const tags = (p as any).usageTags
        if (Array.isArray(tags)) {
          setUsageTagsInput(tags.join(', '))
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [id, token, user])

  useEffect(() => {
    fetch('/api/products/usage-tags')
      .then(r => r.json())
      .then(json => {
        if (Array.isArray(json.tags)) setAvailableTags(json.tags)
      }).catch(console.error)
  }, [])

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls(prev => prev.filter((_, index) => index !== indexToRemove))
    setFileInputs(prev => prev.filter(idx => idx !== indexToRemove))
  }

  const handleRemoveStylingImage = (indexToRemove: number) => {
    setStylingIdeas(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  // Add this helper function after the state declarations
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  // Add these new functions before handleSubmit
  const handleRemoveUpload = (uploadId: string) => {
    setUploadingFiles(prev => {
      const newUploading = { ...prev }
      delete newUploading[uploadId]
      return newUploading
    })
    // If the file was successfully uploaded, also remove it from imageUrls
    const fileInfo = uploadingFiles[uploadId]
    if (fileInfo?.url) {
      setImageUrls(prev => prev.filter(url => url !== fileInfo.url))
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const uploadId = file.name + Date.now()
      
      // Create preview URL for the file
      const preview = URL.createObjectURL(file)
      
      // Initialize upload state with file info
      setUploadingFiles(prev => ({
        ...prev,
        [uploadId]: {
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'uploading',
          preview
        }
      }))

      try {
        const xhr = new XMLHttpRequest()
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total)
            setUploadingFiles(prev => ({
              ...prev,
              [uploadId]: {
                ...prev[uploadId],
                progress
              }
            }))
          }
        }

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

        const url = (await uploadPromise) as any
        setImageUrls(prev => [...prev, url.url])
        
        // Update status to completed instead of removing
        setUploadingFiles(prev => ({
          ...prev,
          [uploadId]: {
            ...prev[uploadId],
            status: 'completed',
            progress: 100,
            url
          }
        }))
      } catch (error) {
        setUploadingFiles(prev => ({
          ...prev,
          [uploadId]: {
            ...prev[uploadId],
            status: 'error',
            progress: 0
          }
        }))
      }

      // Cleanup preview URL when component unmounts
      return () => {
        URL.revokeObjectURL(preview)
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

  const { getRootProps: getStylingRootProps, getInputProps: getStylingInputProps, isDragActive: isStylingDrag } = useDropzone({
    onDrop: onDropStyling,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    // Don't show loading spinner during save, just disable the form
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
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
          usageTags: usageTagsInput
            .split(',')
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0),
        })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Update failed')
      }
      setNotificationType('success')
      setNotificationMessage('Product edited successfully')
      setShowNotification(true)
      // Wait for notification to be visible
      setTimeout(() => {
        setIsSaving(true) // Only show loading spinner for page transition
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
    setShowCancelModal(true)
  }

  if (isLoading || isSaving) return <LoadingSpinner />
  if (error) return <div className={styles.error}>{error}</div>
  if (!product) return <div className={styles.error}>Product not found</div>

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

      {showCancelModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Confirm Cancel</h3>
            <p className={styles.modalText}>Are you sure you want to cancel? Any unsaved changes will be lost.</p>
            <div className={styles.modalButtons}>
              <button
                onClick={() => router.push('/dashboard/admin/products')}
                className={`${styles.modalButton} ${styles.confirmButton}`}
              >
                Yes, Cancel
                <FiArrowRight className={styles.arrowIcon} />
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className={`${styles.modalButton} ${styles.cancelButton}`}
              >
                No, Continue Editing
                <FiArrowRight className={styles.arrowIcon} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.header}>
        <h1 className={styles.title}>Edit Product</h1>
        <p className={styles.subtitle}>Update product information, pricing, inventory and images</p>
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
              placeholder="Add specifications"
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
            <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',marginBottom:'0.5rem'}}>
              {availableTags.map(tag => {
                const selected = usageTagsInput.toLowerCase().split(',').map(t=>t.trim().toLowerCase()).includes(tag.toLowerCase())
                return (
                  <label key={tag} style={{display:'flex',alignItems:'center',gap:'0.25rem'}}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={e => {
                        const tagsArr = usageTagsInput.split(',').map(t=>t.trim()).filter(t=>t)
                        if (e.target.checked) {
                          if (!tagsArr.includes(tag)) tagsArr.push(tag)
                        } else {
                          const idx = tagsArr.indexOf(tag)
                          if (idx>-1) tagsArr.splice(idx,1)
                        }
                        setUsageTagsInput(tagsArr.join(', '))
                      }}
                    />
                    {tag}
                  </label>
                )
              })}
            </div>
            <input
              type="text"
              value={usageTagsInput}
              onChange={e => setUsageTagsInput(e.target.value)}
              className={styles.input}
              placeholder="Comma-separated or type new tags"
            />
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
                  : 'Drag & drop product images here'}
              </p>
              <p className={styles.dropzoneText}>
                {imageUrls.length === 5 
                  ? 'Maximum number of images reached'
                  : `${5 - imageUrls.length} images remaining`}
              </p>
              <button type="button" className={styles.browseButton}>
                <FiUpload />
                Browse Files
              </button>
            </div>

            {/* Uploading Files Progress */}
            {Object.entries(uploadingFiles).map(([uploadId, fileInfo]) => (
              <div key={uploadId} className={`${styles.uploadingOverlay} ${styles[fileInfo.status]}`}>
                <div className={styles.fileInfo}>
                  <img
                    src={fileInfo.preview || fileInfo.url || ''}
                    alt=""
                    className={styles.fileIcon}
                  />
                  <div>
                    <div className={styles.fileName}>{fileInfo.name}</div>
                    <div className={styles.fileSize}>{formatFileSize(fileInfo.size)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={() => handleRemoveUpload(uploadId)}
                >
                  <FiX />
                </button>
                <div className={styles.uploadProgress}>
                  <div 
                    className={styles.uploadProgressBar} 
                    style={{ width: `${fileInfo.progress}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Image Grid */}
            <div className={styles.imageGrid}>
              {imageUrls.map((url, i) =>
                url ? (
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
                ) : null
              )}
            </div>
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
              <div className={styles.imageGrid}>
                {stylingIdeas.map((idea, idx) => (
                  <div key={idea.url} className={styles.previewItem}>
                    <img src={idea.url} alt="styling idea" className={styles.previewImg} />
                    <input
                      type="text"
                      value={idea.text}
                      onChange={e => {
                        const val = e.target.value
                        setStylingIdeas(prev => prev.map((it, i) => i === idx ? { ...it, text: val } : it))
                      }}
                      placeholder="Add a caption for this styling idea"
                      className={styles.stylingCaptionInput}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveStylingImage(idx)}
                      className={styles.removeBtn}
                      title="Remove image"
                    >
                      <FiX />
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
            {submitting ? 'Saving...' : 'Save Changes'}
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
