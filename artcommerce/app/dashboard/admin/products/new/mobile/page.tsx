// File: app/dashboard/admin/products/new/mobile/page.tsx

'use client'

import { useState, FormEvent, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../../contexts/AuthContext'
import styles from './mobile-new-product.module.css'
import { ArrowLeft, Save, X, Upload, Plus, Minus, Check, AlertCircle } from 'lucide-react'
import LoadingSpinner from '../../../../../components/LoadingSpinner'
import { useDropzone } from 'react-dropzone'

export default function MobileNewProductPage() {
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
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({})
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({})
  const [usageTags, setUsageTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [newTagInput, setNewTagInput] = useState('')

  // Mobile-specific UI state
  const [currentSection, setCurrentSection] = useState(0)
  const [expandedSections, setExpandedSections] = useState<{ [key: number]: boolean }>({
    0: true
  })
  const [isNavbarVisible, setIsNavbarVisible] = useState(true)

  const sections = [
    'Basic Information',
    'Pricing & Inventory',
    'Product Images',
    'Styling Ideas',
    'Tags & Categories'
  ]

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

  // Handle navbar visibility based on scroll
  useEffect(() => {
    let prevScrollY = window.scrollY
    let scrollDirection = 0
    let lastScrollTime = Date.now()
    let scrollVelocity = 0
    let scrollTimer: NodeJS.Timeout | null = null
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const currentTime = Date.now()
      const timeDiff = currentTime - lastScrollTime
      
      // Calculate scroll velocity (pixels per millisecond)
      scrollVelocity = Math.abs(currentScrollY - prevScrollY) / Math.max(timeDiff, 1)
      
      // Determine scroll direction (1 for down, -1 for up)
      const currentDirection = currentScrollY > prevScrollY ? 1 : -1
      
      // Update scroll direction only if it changed
      if (currentDirection !== scrollDirection) {
        scrollDirection = currentDirection
      }
      
      // Clear any existing timer
      if (scrollTimer) {
        clearTimeout(scrollTimer)
      }
      
      // Navbar visibility logic (similar to MobileLayout footer logic)
      if (currentScrollY < 50) {
        // Always show navbar when near the top
        setIsNavbarVisible(true)
      } else if (
        scrollDirection > 0 && // Scrolling down
        scrollVelocity > 0.3 && // Fast scroll
        currentScrollY > 100 // Not at the very top
      ) {
        // Hide navbar when scrolling down quickly
        setIsNavbarVisible(false)
      } else if (scrollDirection < 0) { // Scrolling up
        // Show navbar immediately when scrolling up
        setIsNavbarVisible(true)
      }
      
      // Set a timer to show navbar after scrolling stops
      scrollTimer = setTimeout(() => {
        if (currentScrollY > 50) {
          setIsNavbarVisible(true)
        }
      }, 150) // Show after 150ms of no scrolling
      
      // Update values for next iteration
      prevScrollY = currentScrollY
      lastScrollTime = currentTime
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimer) {
        clearTimeout(scrollTimer)
      }
    }
  }, [])

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleRemoveStylingImage = (indexToRemove: number) => {
    setStylingIdeas(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (imageUrls.length + acceptedFiles.length > 5) {
      const overLimit = imageUrls.length + acceptedFiles.length - 5
      setNotificationMessage(`Cannot upload ${acceptedFiles.length} images. Maximum limit is 5 images (${overLimit} too many)`)
      setNotificationType('error')
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 5000)
      return
    }
    
    for (const file of acceptedFiles) {
      if (file.size > 20 * 1024 * 1024) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
        setNotificationMessage(`File ${file.name} exceeds the 20MB size limit (size: ${fileSizeMB}MB)`)
        setNotificationType('error')
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 5000)
        continue
      }
      
      const uploadId = file.name + Date.now()
      setUploadingFiles(prev => ({ ...prev, [uploadId]: true }))
      setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }))
      
      try {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total)
            setUploadProgress(prev => ({ ...prev, [uploadId]: progress }))
          }
        }
        const uploadPromise = new Promise<{ url: string }>((resolve, reject) => {
          xhr.open('POST', `/api/uploads/imagekit?filename=${encodeURIComponent(file.name)}&folder=products`, true)

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText))
              } catch {
                reject(new Error('Invalid response format'))
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
          xhr.onerror = () => reject(new Error('Network error during upload'))
          xhr.ontimeout = () => reject(new Error('Upload timed out'))
          xhr.send(file)
        })
        const result = await uploadPromise
        setImageUrls(prev => [...prev, result.url])
        
        setUploadingFiles(prev => {
          const newState = { ...prev }
          delete newState[uploadId]
          return newState
        })
        
        setNotificationMessage(`Image uploaded successfully`)
        setNotificationType('success')
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 3000)
      } catch (error: any) {
        console.error('Upload failed:', error)
        
        setUploadingFiles(prev => {
          const newState = { ...prev }
          delete newState[uploadId]
          return newState
        })
        
        setUploadErrors(prev => ({
          ...prev,
          [uploadId]: `Failed to upload ${file.name}: ${error.message}`
        }))
        
        setNotificationMessage(`Failed to upload: ${error.message}`)
        setNotificationType('error')
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 5000)
      }
    }
  }, [imageUrls.length])

  const onDropStyling = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (file.size > 20 * 1024 * 1024) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
        setNotificationMessage(`File ${file.name} exceeds the 20MB size limit (size: ${fileSizeMB}MB)`)
        setNotificationType('error')
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 5000)
        continue
      }
      
      const uploadId = `styling-${file.name}-${Date.now()}`
      
      try {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total)
            setUploadProgress(prev => ({ ...prev, [uploadId]: progress }))
          }
        }
        const uploadPromise = new Promise<{ url: string }>((resolve, reject) => {
          xhr.open('POST', `/api/uploads/imagekit?filename=${encodeURIComponent(file.name)}&folder=styling`, true)

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText))
              } catch {
                reject(new Error('Invalid response format'))
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
          xhr.onerror = () => reject(new Error('Network error during upload'))
          xhr.ontimeout = () => reject(new Error('Upload timed out'))
          xhr.send(file)
        })
        const result = await uploadPromise
        setStylingIdeas(prev => [...prev, { url: result.url, text: '' }])
        
        setNotificationMessage(`Styling image uploaded successfully`)
        setNotificationType('success')
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 3000)
      } catch (error: any) {
        console.error('Styling image upload failed:', error)
        
        setNotificationMessage(`Failed to upload styling image: ${error.message || 'Unknown error'}`)
        setNotificationType('error')
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 5000)
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 5 - imageUrls.length,
    maxSize: 20 * 1024 * 1024,
    multiple: true,
  })

  const { getRootProps: getStylingRootProps, getInputProps: getStylingInputProps, isDragActive: isStylingDrag } = useDropzone({
    onDrop: onDropStyling,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 20 * 1024 * 1024,
    multiple: true,
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
        setIsSaving(true)
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

  function handleCancelClick() {
    setIsSaving(true)
    router.push('/dashboard/admin/products')
  }

  const toggleSection = (index: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  if (isLoading || isSaving) return <LoadingSpinner overlay={true} message={isSaving ? "Saving product..." : "Loading..."} />
  if (error) return <div className={styles.error}>{error}</div>

  return (
    <div className={styles.container}>

      {/* Notification */}
      {showNotification && (
        <div className={`${styles.notification} ${styles[notificationType]}`}>
          {notificationType === 'success' ? (
            <Check size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {notificationMessage}
        </div>
      )}

      {/* Form Content */}
      <div className={styles.content}>
        <form id="product-form" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className={styles.section}>
            <div 
              className={styles.sectionHeader}
              onClick={() => toggleSection(0)}
            >
              <span className={styles.sectionTitle}>Basic Information</span>
              {expandedSections[0] ? <Minus size={18} /> : <Plus size={18} />}
            </div>
            {expandedSections[0] && (
              <div className={styles.sectionContent}>
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
            )}
          </div>

          {/* Pricing & Inventory */}
          <div className={styles.section}>
            <div 
              className={styles.sectionHeader}
              onClick={() => toggleSection(1)}
            >
              <span className={styles.sectionTitle}>Pricing & Inventory</span>
              {expandedSections[1] ? <Minus size={18} /> : <Plus size={18} />}
            </div>
            {expandedSections[1] && (
              <div className={styles.sectionContent}>
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
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={e => setIsActive(e.target.checked)}
                        className={styles.checkbox}
                      />
                      Product Active
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Images */}
          <div className={styles.section}>
            <div 
              className={styles.sectionHeader}
              onClick={() => toggleSection(2)}
            >
              <span className={styles.sectionTitle}>Product Images</span>
              {expandedSections[2] ? <Minus size={18} /> : <Plus size={18} />}
            </div>
            {expandedSections[2] && (
              <div className={styles.sectionContent}>
                <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.dropzoneDragActive : ''}`}>
                  <input {...getInputProps()} />
                  <Upload size={24} />
                  <p className={styles.dropzoneText}>
                    {isDragActive
                      ? 'Drop images here...'
                      : 'Tap to select images'}
                  </p>
                  <p className={styles.dropzoneSubtext}>
                    {imageUrls.length === 5 
                      ? 'Maximum reached'
                      : `${5 - imageUrls.length} remaining (max 20MB each)`}
                  </p>
                </div>

                {imageUrls.length > 0 && (
                  <div className={styles.imageGrid}>
                    {imageUrls.map((url, i) => (
                      <div key={i} className={styles.imagePreview}>
                        <img src={url} alt={`Product ${i + 1}`} loading="lazy" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className={styles.removeButton}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {Object.entries(uploadingFiles).map(([uploadId, isUploading]) => (
                  <div key={uploadId} className={styles.uploadProgress}>
                    <Upload size={16} />
                    <span>Uploading... {uploadProgress[uploadId] || 0}%</span>
                  </div>
                ))}

                {Object.entries(uploadErrors).map(([uploadId, error]) => (
                  <p key={uploadId} className={styles.uploadError}>
                    <AlertCircle size={16} />
                    {error}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Styling Ideas */}
          <div className={styles.section}>
            <div 
              className={styles.sectionHeader}
              onClick={() => toggleSection(3)}
            >
              <span className={styles.sectionTitle}>Styling Ideas</span>
              {expandedSections[3] ? <Minus size={18} /> : <Plus size={18} />}
            </div>
            {expandedSections[3] && (
              <div className={styles.sectionContent}>
                <div {...getStylingRootProps()} className={`${styles.dropzone} ${isStylingDrag ? styles.dropzoneDragActive : ''}`}>
                  <input {...getStylingInputProps()} />
                  <Upload size={24} />
                  <p className={styles.dropzoneText}>
                    {isStylingDrag
                      ? 'Drop styling images here...'
                      : 'Tap to select styling images'}
                  </p>
                  <p className={styles.dropzoneSubtext}>Max 20MB each</p>
                </div>

                {stylingIdeas.length > 0 && (
                  <div className={styles.stylingGrid}>
                    {stylingIdeas.map((idea, idx) => (
                      <div key={idea.url} className={styles.stylingItem}>
                        <img src={idea.url} alt="Styling idea" className={styles.stylingImage} loading="lazy" />
                        <input
                          type="text"
                          value={idea.text}
                          onChange={e => {
                            const val = e.target.value
                            setStylingIdeas(prev => prev.map((it, i) => i === idx ? { ...it, text: val } : it))
                          }}
                          placeholder="Add caption..."
                          className={styles.stylingCaption}
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveStylingImage(idx)} 
                          className={styles.removeButton}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tags & Categories */}
          <div className={styles.section}>
            <div 
              className={styles.sectionHeader}
              onClick={() => toggleSection(4)}
            >
              <span className={styles.sectionTitle}>Tags</span>
              {expandedSections[4] ? <Minus size={18} /> : <Plus size={18} />}
            </div>
            {expandedSections[4] && (
              <div className={styles.sectionContent}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Usage Tags</label>
                  <div className={styles.tagOptions}>
                    {availableTags.map(tag => (
                      <label key={tag} className={styles.tagOption}>
                        <input
                          type="checkbox"
                          checked={usageTags.includes(tag)}
                          onChange={e => {
                            setUsageTags(prev => e.target.checked ? [...prev, tag] : prev.filter(t => t !== tag))
                          }}
                          className={styles.checkbox}
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
                    <div className={styles.selectedTags}>
                      {usageTags.map(tag => (
                        <span key={tag} className={styles.tag} onClick={() => setUsageTags(prev => prev.filter(t => t !== tag))}>
                          {tag} <X size={12} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Fixed Footer */}
      <div className={`${styles.footer} ${isNavbarVisible ? styles.footerAboveNavbar : styles.footerInPlace}`}>
        <button 
          onClick={handleCancelClick} 
          className={styles.cancelButton}
          disabled={submitting}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          form="product-form"
          className={styles.submitButton}
          disabled={submitting}
        >
          {submitting ? 'Creating...' : 'Create Product'}
        </button>
      </div>
    </div>
  )
}
