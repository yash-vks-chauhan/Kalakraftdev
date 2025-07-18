// File: app/dashboard/admin/products/[id]/page.tsx

'use client'

import { useEffect, useState, FormEvent, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../../contexts/AuthContext'
import styles from './edit-product.module.css'
import { FiBox, FiDollarSign, FiArchive, FiImage, FiTrash2, FiUploadCloud, FiCheck, FiAlertCircle, FiArrowRight, FiUpload, FiX, FiSave } from 'react-icons/fi'
import { useDropzone } from 'react-dropzone'
import LoadingSpinner from '../../../../components/LoadingSpinner'

interface Product {
  id: number;
  name: string;
  slug: string;
  shortDesc: string | null;
  description: string | null;
  price: number;
  currency: string;
  stockQuantity: number;
  isActive: boolean;
  categoryId: number | null;
  imageUrls: string[] | null;
  specifications: string | null;
  careInstructions: string | null;
  stylingIdeaImages: StylingIdea[] | null;
  usageTags: string[] | null;
  category?: {
    id: number;
    name: string;
  } | null;
}

interface UploadingFile {
  id: string;
  name: string;
  preview: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
}

interface StylingIdea {
  url: string;
  text: string;
}

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);

  // form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [stylingIdeas, setStylingIdeas] = useState<StylingIdea[]>([]);
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [stockQuantity, setStockQuantity] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [usageTags, setUsageTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // UI state
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, UploadingFile>>({});
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({});

  // State for drag-and-drop reordering
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Safe parsing functions
  const safeParseArray = <T,>(value: any, defaultValue: T[] = []): T[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : defaultValue;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  };

  const safeParseImageUrls = (value: any): string[] => {
    const urls = safeParseArray<string | null>(value, []);
    return urls
      .filter((url): url is string => typeof url === 'string' && url.length > 0);
  };

  const safeParseStylingIdeas = (value: any): StylingIdea[] => {
    const ideas = safeParseArray<StylingIdea | null>(value, []);
    return ideas
      .filter((idea): idea is StylingIdea => 
        idea !== null && 
        typeof idea === 'object' && 
        typeof idea.url === 'string' && 
        idea.url.length > 0 &&
        typeof idea.text === 'string'
      );
  };

  const safeParseUsageTags = (value: any): string[] => {
    const tags = safeParseArray<string | null>(value, []);
    return tags
      .filter((tag): tag is string => typeof tag === 'string' && tag.length > 0);
  };

  useEffect(() => {
    if (!token) return;

    // Fetch categories
    fetch('/api/categories', { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch(() => setError("Failed to load categories."));

    // Fetch available tags
    fetch('/api/products/usage-tags')
      .then(r => r.json())
      .then(json => {
        if (Array.isArray(json.tags)) setAvailableTags(json.tags);
      })
      .catch(console.error);

    // Fetch product data
    fetch(`/api/admin/products/${id}`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then(async r => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then(json => {
        const p = json.product;
        if (!p) {
          throw new Error("Product data is null.");
        }
        
        // Set basic product info with safe defaults
        setName(p.name || '');
        setSlug(p.slug || '');
        setShortDesc(p.shortDesc || '');
        setDescription(p.description || '');
        setSpecifications(p.specifications || '');
        setCareInstructions(p.careInstructions || '');
        
        // Handle arrays with safe parsing
        setStylingIdeas(safeParseStylingIdeas(p.stylingIdeaImages));
        setImageUrls(safeParseImageUrls(p.imageUrls));
        setUsageTags(safeParseUsageTags(p.usageTags));
        
        // Handle numeric values
        setPrice(typeof p.price === 'number' ? p.price : 0);
        setStockQuantity(typeof p.stockQuantity === 'number' ? p.stockQuantity : 0);
        
        // Handle other fields
        setCurrency(p.currency || 'USD');
        setIsActive(p.isActive === true);
        setCategoryId(p.categoryId || null);
        
        // Store the full product data
        setProduct(p);
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id, token]);

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Function to reorder images array
  const reorderImages = (fromIndex: number, toIndex: number) => {
    setImageUrls(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleRemoveStylingImage = (indexToRemove: number) => {
    setStylingIdeas(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Check if adding these files would exceed the maximum of 5 images
    if (imageUrls.length + acceptedFiles.length > 5) {
      const overLimit = imageUrls.length + acceptedFiles.length - 5;
      setUploadErrors(prev => ({
        ...prev,
        'image-limit': `Cannot upload ${acceptedFiles.length} images. Maximum limit is 5 images (${overLimit} too many)`
      }));
      
      // Show error notification
      setNotificationMessage(`Cannot upload ${acceptedFiles.length} images. Maximum limit is 5 images (${overLimit} too many)`);
      setNotificationType('error');
      setShowNotification(true);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      
      return;
    }
    
    for (const file of acceptedFiles) {
      if (!file?.name) continue;
      
      // Check file size - 10MB limit
      if (file.size > 10 * 1024 * 1024) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setUploadErrors(prev => ({
          ...prev,
          [`${file.name}-size`]: `File ${file.name} exceeds the 10MB size limit (size: ${fileSizeMB}MB)`
        }));
        
        // Show error notification
        setNotificationMessage(`File ${file.name} exceeds the 10MB size limit (size: ${fileSizeMB}MB)`);
        setNotificationType('error');
        setShowNotification(true);
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
        
        continue;
      }
      
      const uploadId = `${file.name}-${file.size}-${Date.now()}`;
      const preview = URL.createObjectURL(file);
      
      setUploadingFiles(prev => ({
        ...prev,
        [uploadId]: { id: uploadId, name: file.name, preview, progress: 0, status: 'uploading' }
      }));
      
      setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }));

      try {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total);
            setUploadingFiles(prev => ({ ...prev, [uploadId]: { ...prev[uploadId], progress } }));
            setUploadProgress(prev => ({ ...prev, [uploadId]: progress }));
          }
        };

        const uploadPromise = new Promise<{ url: string }>((resolve, reject) => {
          xhr.open('POST', `/api/uploads/imagekit?filename=${encodeURIComponent(file.name)}&folder=products`, true);
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (error) {
                reject(new Error('Invalid response format'));
              }
            } else {
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                reject(new Error(errorResponse.error || `Upload failed with status ${xhr.status}`));
              } catch (e) {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            }
          };
          
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.ontimeout = () => reject(new Error('Upload timed out'));
          
          xhr.send(file);
        });

        const result = await uploadPromise;
        
        // Update the UI with the new image
        setImageUrls(prev => [...prev, result.url]);
        
        // Remove from uploading files
        setUploadingFiles(prev => {
          const newState = { ...prev };
          delete newState[uploadId];
          return newState;
        });
        
        // Show success notification
        setNotificationMessage(`Image ${file.name} uploaded successfully`);
        setNotificationType('success');
        setShowNotification(true);
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
        
        // Release the object URL
        URL.revokeObjectURL(preview);
      } catch (error: any) {
        console.error('Upload error:', error);
        
        // Add to upload errors
        setUploadErrors(prev => ({
          ...prev,
          [uploadId]: `Failed to upload ${file.name}: ${error.message}`
        }));
        
        // Remove from uploading files
        setUploadingFiles(prev => {
          const newState = { ...prev };
          delete newState[uploadId];
          return newState;
        });
        
        // Show error notification
        setNotificationMessage(`Failed to upload ${file.name}: ${error.message}`);
        setNotificationType('error');
        setShowNotification(true);
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
        
        // Release the object URL
        URL.revokeObjectURL(preview);
      }
    }
  }, [imageUrls.length, setNotificationMessage, setNotificationType, setShowNotification]);

  const onDropStyling = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      // Check file size - 10MB limit
      if (file.size > 10 * 1024 * 1024) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setNotificationMessage(`File ${file.name} exceeds the 10MB size limit (size: ${fileSizeMB}MB)`);
        setNotificationType('error');
        setShowNotification(true);
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
        continue;
      }
      
      const uploadId = `styling-${file.name}-${Date.now()}`;
      
      // Show uploading notification
      setNotificationMessage(`Uploading ${file.name}...`);
      setNotificationType('success');
      setShowNotification(true);
      
      try {
        // Use XMLHttpRequest to track upload progress
        const xhr = new XMLHttpRequest();
        
        const uploadPromise = new Promise<{ url: string }>((resolve, reject) => {
          xhr.open('POST', `/api/uploads/imagekit?filename=${encodeURIComponent(file.name)}&folder=styling`, true);
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (error) {
                reject(new Error('Invalid response format'));
              }
            } else {
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                reject(new Error(errorResponse.error || `Upload failed with status ${xhr.status}`));
              } catch (e) {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            }
          };
          
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.ontimeout = () => reject(new Error('Upload timed out'));
          
          xhr.send(file);
        });
        
        const result = await uploadPromise;
        
        // Add the styling image to the state
        setStylingIdeas(prev => [...prev, { url: result.url, text: '' }]);
        
        // Show success notification
        setNotificationMessage(`Styling image ${file.name} uploaded successfully`);
        setNotificationType('success');
        setShowNotification(true);
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
      } catch (error: any) {
        console.error('Styling image upload failed:', error);
        
        // Show error notification
        setNotificationMessage(`Failed to upload styling image: ${error.message || 'Unknown error'}`);
        setNotificationType('error');
        setShowNotification(true);
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }
    }
  }, [setNotificationMessage, setNotificationType, setShowNotification]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxFiles: 5 - imageUrls.length,
    maxSize: 10 * 1024 * 1024, // 10MB in bytes
    multiple: true,
  });

  const { getRootProps: getStylingRootProps, getInputProps: getStylingInputProps, isDragActive: isStylingDrag } = useDropzone({
    onDrop: onDropStyling,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxSize: 10 * 1024 * 1024, // 10MB in bytes
    multiple: true,
  });

  // Handle file rejections from dropzone
  useEffect(() => {
    if (fileRejections.length > 0) {
      fileRejections.forEach(({ file, errors }) => {
        errors.forEach(error => {
          if (error.code === 'file-too-large') {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            setNotificationMessage(`File ${file.name} exceeds the 10MB size limit (size: ${fileSizeMB}MB)`);
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
    e.preventDefault();
    setSubmitting(true);
    try {
      // Prepare data for API
      const productData = {
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
        categoryId: categoryId,
        imageUrls,
        usageTags,
      };

      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(productData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Update failed');
      }

      setNotificationMessage('Product saved successfully!');
      setNotificationType('success');
      setShowNotification(true);
      setTimeout(() => router.push('/dashboard/admin/products'), 1500);
    } catch (err: any) {
      setNotificationMessage(err.message || 'An unknown error occurred');
      setNotificationType('error');
      setShowNotification(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="p-4 text-red-600 bg-red-100 rounded-md">Error: {error}</div>;

  return (
    <main className={styles.container}>
      {showNotification && (
        <div className={`${styles.notification} ${styles[notificationType]}`}>
          {notificationType === 'success' ? <FiCheck /> : <FiAlertCircle />} {notificationMessage}
        </div>
      )}
      
      <h1 className={styles.title}>Edit Product</h1>
      <p className={styles.subtitle}>Update product information, pricing, inventory and images</p>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}><FiBox /> Basic Information</h2>
          <div className={styles.formGroup}>
            <label className={styles.label}>Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className={styles.input} 
              required 
              placeholder="Enter product name"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Slug</label>
            <input 
              type="text" 
              value={slug} 
              onChange={e => setSlug(e.target.value)} 
              className={styles.input} 
              required 
              placeholder="product-url-slug"
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
            ></textarea>
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
          <h2 className={styles.sectionTitle}><FiImage /> Product Images</h2>
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
                  : `${5 - imageUrls.length} images remaining (max 10MB per image)`}
              </p>
            </div>

            <div className={styles.imageGrid}>
              {imageUrls.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className={styles.imagePreviewContainer}
                  draggable
                  onDragStart={() => setDraggingIndex(i)}
                  onDragOver={e => e.preventDefault()}
                  onDragEnd={() => setDraggingIndex(null)}
                  onDrop={() => {
                    if (draggingIndex !== null) {
                      reorderImages(draggingIndex, i);
                    }
                    setDraggingIndex(null);
                  }}
                >
                  <img
                    src={url}
                    alt={`Product preview ${i + 1}`