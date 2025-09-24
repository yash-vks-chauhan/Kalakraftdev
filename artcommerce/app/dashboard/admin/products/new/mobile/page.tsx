// File: app/dashboard/admin/products/new/mobile/page.tsx

'use client'

import { useState, FormEvent, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../../contexts/AuthContext'
import styles from './mobile-new-product.module.css'
import { ArrowLeft, Save, X, Upload, Plus, Minus, Check, AlertCircle, Camera, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import LoadingSpinner from '../../../../../components/LoadingSpinner'
import { useDropzone } from 'react-dropzone'

// Step interface
interface Step {
  id: number
  title: string
  icon: string
  description: string
}

const STEPS: Step[] = [
  { id: 1, title: "Basic Info", icon: "📝", description: "Product name and description" },
  { id: 2, title: "Pricing", icon: "💰", description: "Price and inventory details" },
  { id: 3, title: "Images", icon: "📸", description: "Product photos" },
  { id: 4, title: "Styling", icon: "✨", description: "Styling ideas and tips" },
  { id: 5, title: "Review", icon: "✅", description: "Final review and create" }
]

export default function MobileNewProductPage() {
  const { token, user } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
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

  // Step-based UI state
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [autoSaveStatus, setAutoSaveStatus] = useState('')

  // Smart suggestions based on product name
  const generateSlugFromName = (productName: string) => {
    return productName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const suggestCategoryFromName = (productName: string) => {
    const name = productName.toLowerCase()
    const suggestions = [
      { keywords: ['painting', 'canvas', 'artwork', 'art'], categoryName: 'Paintings' },
      { keywords: ['sculpture', 'statue', 'carved'], categoryName: 'Sculptures' },
      { keywords: ['jewelry', 'necklace', 'ring', 'earring'], categoryName: 'Jewelry' },
      { keywords: ['textile', 'fabric', 'cloth', 'tapestry'], categoryName: 'Textiles' },
      { keywords: ['ceramic', 'pottery', 'vase', 'bowl'], categoryName: 'Ceramics' }
    ]
    
    for (const suggestion of suggestions) {
      if (suggestion.keywords.some(keyword => name.includes(keyword))) {
        const category = categories.find(c => c.name.toLowerCase().includes(suggestion.categoryName.toLowerCase()))
        return category?.id
      }
    }
    return null
  }

  // Form validation
  const validateStep = (step: number): boolean => {
    const errors: { [key: string]: string } = {}
    
    switch (step) {
      case 1:
        if (!name.trim()) errors.name = 'Product name is required'
        if (!slug.trim()) errors.slug = 'Product slug is required'
        if (slug.length < 3) errors.slug = 'Slug must be at least 3 characters'
        break
      case 2:
        if (price <= 0) errors.price = 'Price must be greater than 0'
        if (!categoryId) errors.categoryId = 'Please select a category'
        break
      case 3:
        if (imageUrls.length === 0) errors.images = 'At least one product image is required'
        break
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const canProceedToNextStep = (): boolean => {
    return validateStep(currentStep)
  }

  // Auto-save functionality (client-side only)
  useEffect(() => {
    if (!autoSaveEnabled || typeof window === 'undefined' || !mounted || currentStep === 1) return
    
    // Only save if there's meaningful data and user has started entering data
    const hasData = name?.trim() || description?.trim() || price > 0 || (imageUrls && imageUrls.length > 0)
    if (!hasData) return
    
    const saveTimer = setTimeout(() => {
      try {
        // Validate data before saving
        const formData = {
          name: name || '', 
          slug: slug || '', 
          shortDesc: shortDesc || '', 
          description: description || '', 
          specifications: specifications || '', 
          careInstructions: careInstructions || '',
          price: Number(price) || 0, 
          currency: currency || 'USD', 
          stockQuantity: Number(stockQuantity) || 0, 
          isActive: Boolean(isActive), 
          categoryId: categoryId || '', 
          imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
          stylingIdeas: Array.isArray(stylingIdeas) ? stylingIdeas : [], 
          usageTags: Array.isArray(usageTags) ? usageTags : [], 
          currentStep: Number(currentStep) || 1,
          timestamp: new Date().toISOString()
        }
        
        // Only save if data has substance
        if (formData.name || formData.description || formData.price > 0) {
          localStorage.setItem('product-draft', JSON.stringify(formData))
          setAutoSaveStatus('Auto-saved')
          setTimeout(() => setAutoSaveStatus(''), 2000)
        }
      } catch (e) {
        console.error('Failed to save draft:', e)
        setAutoSaveStatus('Save failed')
        setTimeout(() => setAutoSaveStatus(''), 2000)
      }
    }, 2000) // 2 second delay
    
    return () => clearTimeout(saveTimer)
  }, [mounted, name, slug, shortDesc, description, specifications, careInstructions, price, currency, stockQuantity, isActive, categoryId, imageUrls, stylingIdeas, usageTags, currentStep, autoSaveEnabled])

  // Load draft on mount
  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Unauthorized')
      return
    }
    
    // Load categories and tags
    fetch('/api/categories')
      .then(r => r.json())
      .then(json => setCategories(json.categories || []))
      .catch(console.error)
    
    fetch('/api/products/usage-tags')
      .then(r => r.json())
      .then(json => {
        if (Array.isArray(json.tags)) setAvailableTags(json.tags)
      })
      .catch(console.error)
  }, [user])

  // Mount effect with safe draft loading
  useEffect(() => {
    setMounted(true)
    
    // Delay draft loading to avoid SSR issues
    const loadDraftTimer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          const draft = localStorage.getItem('product-draft')
          if (draft && draft !== 'undefined' && draft !== 'null') {
            const parsed = JSON.parse(draft)
            
            // Validate parsed data structure
            if (parsed && typeof parsed === 'object') {
              // Only show prompt if draft has meaningful data
              const hasData = (parsed.name && parsed.name.trim()) || 
                             (parsed.description && parsed.description.trim()) || 
                             (parsed.price && parsed.price > 0) || 
                             (Array.isArray(parsed.imageUrls) && parsed.imageUrls.length > 0)
              
              if (hasData) {
                const shouldContinue = confirm('Continue with your saved draft?')
                if (shouldContinue) {
                  // Safely set all values with proper validation
                  setName(parsed.name && typeof parsed.name === 'string' ? parsed.name.trim() : '')
                  setSlug(parsed.slug && typeof parsed.slug === 'string' ? parsed.slug.trim() : '')
                  setShortDesc(parsed.shortDesc && typeof parsed.shortDesc === 'string' ? parsed.shortDesc.trim() : '')
                  setDescription(parsed.description && typeof parsed.description === 'string' ? parsed.description.trim() : '')
                  setSpecifications(parsed.specifications && typeof parsed.specifications === 'string' ? parsed.specifications.trim() : '')
                  setCareInstructions(parsed.careInstructions && typeof parsed.careInstructions === 'string' ? parsed.careInstructions.trim() : '')
                  setPrice(parsed.price && typeof parsed.price === 'number' && parsed.price > 0 ? parsed.price : 0)
                  setCurrency(parsed.currency && typeof parsed.currency === 'string' ? parsed.currency : 'INR')
                  setStockQuantity(parsed.stockQuantity && typeof parsed.stockQuantity === 'number' && parsed.stockQuantity >= 0 ? parsed.stockQuantity : 0)
                  setIsActive(typeof parsed.isActive === 'boolean' ? parsed.isActive : true)
                  setCategoryId(parsed.categoryId || '')
                  setImageUrls(Array.isArray(parsed.imageUrls) ? parsed.imageUrls.filter(url => url && typeof url === 'string') : [])
                  setStylingIdeas(Array.isArray(parsed.stylingIdeas) ? parsed.stylingIdeas.filter(idea => idea && typeof idea === 'string') : [])
                  setUsageTags(Array.isArray(parsed.usageTags) ? parsed.usageTags.filter(tag => tag && typeof tag === 'string') : [])
                  setCurrentStep(parsed.currentStep && typeof parsed.currentStep === 'number' && parsed.currentStep >= 1 && parsed.currentStep <= 5 ? parsed.currentStep : 1)
                } else {
                  // User declined draft, clear it
                  localStorage.removeItem('product-draft')
                }
              } else {
                // Clear empty or invalid draft
                localStorage.removeItem('product-draft')
              }
            } else {
              // Invalid draft structure
              localStorage.removeItem('product-draft')
            }
          }
        } catch (e) {
          console.error('Failed to load draft:', e)
          // Clear corrupted draft
          try {
            localStorage.removeItem('product-draft')
          } catch (clearError) {
            console.error('Failed to clear corrupted draft:', clearError)
          }
        }
      }
    }, 500) // 500ms delay to ensure proper hydration
    
    return () => clearTimeout(loadDraftTimer)
  }, [])

  // Smart slug generation
  useEffect(() => {
    if (name && !slug) {
      setSlug(generateSlugFromName(name))
    }
  }, [name]) // Removed slug from dependencies to prevent infinite loop

  // Smart category suggestion
  useEffect(() => {
    if (name && !categoryId && categories.length > 0) {
      const suggestedId = suggestCategoryFromName(name)
      if (suggestedId) {
        setCategoryId(suggestedId)
      }
    }
  }, [name, categories]) // Removed categoryId from dependencies to prevent infinite loop



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
    try {
      e.preventDefault()
      e.stopPropagation()
      
      if (!mounted || submitting) return
      
      setError(null)
      setSubmitting(true)
      
      // Validate required fields
      if (!name?.trim() || !slug?.trim()) {
        throw new Error('Name and slug are required')
      }
      
      // Validate data types
      const validatedData = {
        name: String(name).trim(),
        slug: String(slug).trim(),
        shortDesc: String(shortDesc || '').trim(),
        description: String(description || '').trim(),
        specifications: String(specifications || '').trim(),
        careInstructions: String(careInstructions || '').trim(),
        stylingIdeaImages: Array.isArray(stylingIdeas) ? stylingIdeas.filter(idea => idea && typeof idea === 'string') : [],
        price: Number(price) || 0,
        currency: String(currency) || 'INR',
        stockQuantity: Number(stockQuantity) || 0,
        isActive: Boolean(isActive),
        categoryId: categoryId ? Number(categoryId) : null,
        imageUrls: Array.isArray(imageUrls) ? imageUrls.filter(url => url && typeof url === 'string') : [],
        usageTags: Array.isArray(usageTags) ? usageTags.filter(tag => tag && typeof tag === 'string') : [],
      }
      
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(validatedData)
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
    // Clear draft when canceling
    if (typeof window !== 'undefined') {
      localStorage.removeItem('product-draft')
    }
    setIsSaving(true)
    router.push('/dashboard/admin/products')
  }

  function clearDraft() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('product-draft')
    }
    // Reset all form fields
    setName('')
    setSlug('')
    setShortDesc('')
    setDescription('')
    setSpecifications('')
    setCareInstructions('')
    setPrice(0)
    setCurrency('INR')
    setStockQuantity(0)
    setIsActive(true)
    setCategoryId('')
    setImageUrls([])
    setStylingIdeas([])
    setUsageTags([])
    setCurrentStep(1)
    setCompletedSteps([])
    setFieldErrors({})
    
    setNotificationMessage('Draft cleared - starting fresh!')
    setNotificationType('success')
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
  }

  // Step navigation
  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < STEPS.length) {
      setCompletedSteps(prev => [...prev.filter(s => s !== currentStep), currentStep])
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const goToStep = (step: number) => {
    if (step <= currentStep || completedSteps.includes(step - 1)) {
      setCurrentStep(step)
    }
  }

  // Show loading until component is mounted (prevents hydration mismatch)
  if (!mounted || isLoading || isSaving) {
    return <LoadingSpinner overlay={true} message={isSaving ? "Saving product..." : "Loading..."} />
  }

  // Add safety check for auth
  if (!user) {
    return <LoadingSpinner overlay={true} message="Authenticating..." />
  }
  
  if (error) return <div className={styles.error}>{error}</div>

  // Helper Components
  const ValidatedInput = ({ 
    value, 
    onChange, 
    placeholder, 
    required = false, 
    type = "text", 
    fieldName,
    ...props 
  }: any) => (
    <div className={styles.formField}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${styles.floatingInput} ${fieldErrors[fieldName] ? styles.inputError : ''}`}
        required={required}
        {...props}
      />
      <label className={styles.floatingLabel}>{placeholder}</label>
      {fieldErrors[fieldName] && (
        <div className={styles.errorHint}>
          <AlertCircle size={14} />
          {fieldErrors[fieldName]}
        </div>
      )}
      {!fieldErrors[fieldName] && value && required && (
        <div className={styles.successIcon}>
          <Check size={16} />
        </div>
      )}
    </div>
  )

  const ValidatedTextarea = ({ 
    value, 
    onChange, 
    placeholder, 
    rows = 4,
    fieldName,
    ...props 
  }: any) => (
    <div className={styles.formField}>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`${styles.floatingTextarea} ${fieldErrors[fieldName] ? styles.inputError : ''}`}
        {...props}
      />
      <label className={styles.floatingLabel}>{placeholder}</label>
      {fieldErrors[fieldName] && (
        <div className={styles.errorHint}>
          <AlertCircle size={14} />
          {fieldErrors[fieldName]}
        </div>
      )}
    </div>
  )

  const SmartSuggestions = ({ field, value }: { field: string, value: any }) => {
    if (field === 'slug' && name && slug === generateSlugFromName(name)) {
      return (
        <div className={styles.smartSuggestion}>
          <span className={styles.suggestionIcon}>💡</span>
          <span className={styles.suggestionText}>Auto-generated from product name</span>
        </div>
      )
    }
    
    if (field === 'category' && name && categoryId) {
      const suggestedId = suggestCategoryFromName(name)
      if (suggestedId === categoryId) {
        return (
          <div className={styles.smartSuggestion}>
            <span className={styles.suggestionIcon}>🎯</span>
            <span className={styles.suggestionText}>Smart suggestion based on product name</span>
          </div>
        )
      }
    }
    
    return null
  }

  const ImageUploadCard = () => (
    <div className={styles.imageUploadCard}>
      <div className={styles.uploadIconContainer}>
        <Camera size={32} className={styles.cameraIcon} />
      </div>
      <h3 className={styles.uploadTitle}>Add Product Photos</h3>
      <p className={styles.uploadDescription}>Take or upload up to 5 high-quality images</p>
      
      <div className={styles.uploadOptions}>
        <div {...getRootProps()} className={styles.uploadOption}>
          <input {...getInputProps()} />
          <Camera size={20} />
          <span>Camera</span>
        </div>
        <div {...getRootProps()} className={styles.uploadOption}>
          <input {...getInputProps()} />
          <ImageIcon size={20} />
          <span>Gallery</span>
        </div>
      </div>
      
      <div className={styles.uploadHint}>
        <span>Maximum 20MB per image • {5 - imageUrls.length} remaining</span>
      </div>
    </div>
  )

  const ProductPreview = () => (
    <div className={styles.previewContainer}>
      <div className={styles.previewCard}>
        <div className={styles.previewHeader}>
          <h3>Review Your Product</h3>
          <p>Double-check everything looks perfect</p>
        </div>
        
        <div className={styles.previewContent}>
          <div className={styles.productMockup}>
            {imageUrls?.length > 0 ? (
              <img src={imageUrls[0]} alt={name || 'Product'} className={styles.mockupImage} />
            ) : (
              <div className={styles.mockupPlaceholder}>
                <Camera size={48} />
                <span>No image uploaded</span>
              </div>
            )}
          </div>
          
          <div className={styles.previewDetails}>
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>Name:</span>
              <span className={styles.previewValue}>{name || 'Not set'}</span>
            </div>
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>Price:</span>
              <span className={styles.previewValue}>{currency} {price || 0}</span>
            </div>
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>Category:</span>
              <span className={styles.previewValue}>
                {categories?.find(c => c?.id === categoryId)?.name || 'Not selected'}
              </span>
            </div>
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>Stock:</span>
              <span className={styles.previewValue}>{stockQuantity || 0}</span>
            </div>
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>Images:</span>
              <span className={styles.previewValue}>{imageUrls?.length || 0} uploaded</span>
            </div>
            {usageTags?.length > 0 && (
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>Tags:</span>
                <div className={styles.previewTags}>
                  {usageTags?.map(tag => (
                    <span key={tag} className={styles.previewTag}>{tag || ''}</span>
                  )) || null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepDescription}>
              <p>Let's start with the basic information about your product.</p>
            </div>
            
            <ValidatedInput
              value={name}
              onChange={(e: any) => setName(e.target.value)}
              placeholder="Product Name"
              required
              fieldName="name"
            />
            <SmartSuggestions field="name" value={name} />
            
            <ValidatedInput
              value={slug}
              onChange={(e: any) => setSlug(e.target.value)}
              placeholder="URL Slug"
              required
              fieldName="slug"
            />
            <SmartSuggestions field="slug" value={slug} />
            
            <ValidatedInput
              value={shortDesc}
              onChange={(e: any) => setShortDesc(e.target.value)}
              placeholder="Short Description"
              fieldName="shortDesc"
            />
            
            <ValidatedTextarea
              value={description}
              onChange={(e: any) => setDescription(e.target.value)}
              placeholder="Full Description"
              rows={4}
              fieldName="description"
            />
            
            <ValidatedTextarea
              value={specifications}
              onChange={(e: any) => setSpecifications(e.target.value)}
              placeholder="Specifications (materials, dimensions, etc.)"
              rows={3}
              fieldName="specifications"
            />
            
            <ValidatedTextarea
              value={careInstructions}
              onChange={(e: any) => setCareInstructions(e.target.value)}
              placeholder="Care Instructions"
              rows={3}
              fieldName="careInstructions"
            />
          </div>
        )

      case 2:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepDescription}>
              <p>Set your pricing and inventory details.</p>
            </div>
            
            <div className={styles.formField}>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                className={`${styles.floatingSelect} ${fieldErrors?.categoryId ? styles.inputError : ''}`}
                required
              >
                <option value="">Select category</option>
                {categories?.map(c => (
                  <option key={c?.id} value={c?.id}>{c?.name || 'Unknown Category'}</option>
                )) || null}
              </select>
              <label className={styles.floatingLabel}>Category</label>
              {fieldErrors.categoryId && (
                <div className={styles.errorHint}>
                  <AlertCircle size={14} />
                  {fieldErrors.categoryId}
                </div>
              )}
            </div>
            <SmartSuggestions field="category" value={categoryId} />
            
            <div className={styles.formRow}>
              <ValidatedInput
                type="number"
                value={price}
                onChange={(e: any) => setPrice(parseFloat(e.target.value) || 0)}
                placeholder="Price"
                min="0"
                step="0.01"
                required
                fieldName="price"
              />
              
              <div className={styles.formField}>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className={styles.floatingSelect}
                  required
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
                <label className={styles.floatingLabel}>Currency</label>
              </div>
            </div>
            
            <ValidatedInput
              type="number"
              value={stockQuantity}
              onChange={(e: any) => setStockQuantity(parseInt(e.target.value) || 0)}
              placeholder="Stock Quantity"
              min="0"
              fieldName="stockQuantity"
            />
            
            <div className={styles.checkboxContainer}>
              <label className={styles.modernCheckboxLabel}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className={styles.modernCheckbox}
                />
                <span className={styles.checkboxText}>Product is active and visible</span>
              </label>
            </div>
          </div>
        )

      case 3:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepDescription}>
              <p>Add high-quality photos of your product.</p>
            </div>
            
            {imageUrls.length === 0 ? (
              <ImageUploadCard />
            ) : (
              <>
                <div className={styles.imageGrid}>
                  {imageUrls?.map((url, i) => (
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
                  )) || null}
                </div>
                
                {imageUrls.length < 5 && (
                  <div {...getRootProps()} className={`${styles.addMoreButton} ${isDragActive ? styles.dragActive : ''}`}>
                    <input {...getInputProps()} />
                    <Plus size={20} />
                    <span>Add More Images ({5 - imageUrls.length} remaining)</span>
                  </div>
                )}
              </>
            )}
            
            {Object.entries(uploadingFiles).map(([uploadId, isUploading]) => (
              <div key={uploadId} className={styles.uploadProgress}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${uploadProgress[uploadId] || 0}%` }}
                  />
                </div>
                <span>Uploading... {uploadProgress[uploadId] || 0}%</span>
              </div>
            ))}
            
            {fieldErrors.images && (
              <div className={styles.errorHint}>
                <AlertCircle size={14} />
                {fieldErrors.images}
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepDescription}>
              <p>Add styling images and usage tags to help customers.</p>
            </div>
            
            <div className={styles.subSection}>
              <h4 className={styles.subSectionTitle}>Styling Ideas</h4>
              <div {...getStylingRootProps()} className={`${styles.stylingDropzone} ${isStylingDrag ? styles.dragActive : ''}`}>
                <input {...getStylingInputProps()} />
                <Upload size={24} />
                <p>Add styling inspiration images</p>
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
            
            <div className={styles.subSection}>
              <h4 className={styles.subSectionTitle}>Usage Tags</h4>
              <div className={styles.tagOptions}>
                {availableTags.map(tag => (
                  <label key={tag} className={styles.tagOption}>
                    <input
                      type="checkbox"
                      checked={usageTags.includes(tag)}
                      onChange={e => {
                        setUsageTags(prev => e.target.checked ? [...prev, tag] : prev.filter(t => t !== tag))
                      }}
                      className={styles.modernCheckbox}
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
              
              <ValidatedInput
                value={newTagInput}
                onChange={(e: any) => setNewTagInput(e.target.value)}
                placeholder="Add new tag and press Enter"
                onKeyDown={(e: any) => {
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
                fieldName="newTag"
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
        )

      case 5:
        return <ProductPreview />

      default:
        return null
    }
  }

  // Don't render until mounted to prevent hydration errors
  if (!mounted) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  try {
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

      {/* Step Header */}
      <div className={styles.stepHeader}>
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }} 
            />
          </div>
          <div className={styles.stepInfo}>
            <span className={styles.stepNumber}>Step {currentStep} of {STEPS?.length || 5}</span>
            <h2 className={styles.stepTitle}>
              <span className={styles.stepIcon}>{STEPS?.[currentStep - 1]?.icon || '📝'}</span>
              {STEPS?.[currentStep - 1]?.title || 'Loading...'}
            </h2>
            <p className={styles.stepDescription}>{STEPS?.[currentStep - 1]?.description || 'Please wait...'}</p>
          </div>
        </div>
        
        {/* Step Indicators */}
        <div 
          role="tablist" 
          aria-label="Product creation steps"
          className={styles.stepIndicators}
        >
          {STEPS?.map((step, index) => (
            <button
              key={step?.id || index}
              role="tab"
              aria-selected={currentStep === step?.id}
              aria-controls={`panel-${step?.id}`}
              tabIndex={currentStep === step?.id ? 0 : -1}
              className={`${styles.stepIndicator} ${
                currentStep === step?.id ? styles.stepIndicatorActive : ''
              } ${
                completedSteps.includes(step?.id) ? styles.stepIndicatorCompleted : ''
              }`}
              onClick={() => goToStep(step?.id)}
              disabled={step?.id > currentStep && !completedSteps.includes(step?.id - 1)}
            >
              <span className={styles.stepIndicatorIcon}>
                {completedSteps.includes(step?.id) ? '✓' : (step?.icon || '')}
              </span>
            </button>
          )) || null}
        </div>
      </div>

      {/* Step Content */}
      <div className={styles.content}>
        <form onSubmit={handleSubmit}>
          <div 
            id={`panel-${currentStep}`}
            role="tabpanel"
            aria-labelledby={`tab-${currentStep}`}
            className={styles.stepPanel}
          >
            {renderStepContent() || <div>Loading step content...</div>}
          </div>
        </form>
      </div>

      {/* Auto-save indicator */}
      {mounted && autoSaveEnabled && (
        <div className={styles.autoSaveIndicator}>
          <span>
            {autoSaveStatus || '✓ Auto-saving'}
          </span>
          <button 
            type="button" 
            onClick={clearDraft}
            className={styles.clearDraftButton}
            title="Clear draft and start fresh"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Step Navigation */}
      <div className={styles.stepNavigation}>
        {currentStep > 1 && (
          <button 
            type="button"
            className={styles.backButton} 
            onClick={prevStep}
          >
            <ChevronLeft size={18} />
            Back
          </button>
        )}
        
        <div className={styles.navigationSpacer} />
        
        {currentStep < STEPS.length ? (
          <button 
            type="button"
            className={styles.nextButton} 
            disabled={!canProceedToNextStep()}
            onClick={nextStep}
          >
            Continue
            <ChevronRight size={18} />
          </button>
        ) : (
          <button 
            type="submit"
            className={styles.createButton}
            disabled={submitting || !canProceedToNextStep()}
          >
            {submitting ? (
              <>
                <div className={styles.spinner} />
                Creating...
              </>
            ) : (
              <>
                🚀 Create Product
              </>
            )}
          </button>
        )}
        
        <button 
          type="button"
          onClick={handleCancelClick} 
          className={styles.cancelLink}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </div>
    )
  } catch (error) {
    console.error('Mobile product page error:', error)
    return (
      <div className={styles.container} style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ background: '#fee', border: '1px solid #fcc', borderRadius: '8px', padding: '1rem' }}>
          <AlertCircle size={24} style={{ color: '#d00', marginBottom: '0.5rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: '#d00' }}>Something went wrong</h3>
          <p style={{ margin: '0', color: '#666' }}>Please try refreshing the page</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '1rem', 
              padding: '0.5rem 1rem', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
}
