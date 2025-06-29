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

  const handleRemoveStylingImage = (indexToRemove: number) => {
    setStylingIdeas(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (!file?.name) continue;
      
      // Check file size - 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        setUploadErrors(prev => ({
          ...prev,
          [`${file.name}-size`]: `File ${file.name} exceeds the 5MB size limit`
        }));
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

        const uploadPromise = new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response && response.url) {
                  resolve(response);
                } else {
                  reject(new Error('Invalid response format - missing URL'));
                }
              } catch (e) {
                reject(new Error('Invalid response format'));
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.ontimeout = () => reject(new Error('Upload timed out'));
        });

        xhr.open('POST', `/api/uploads?filename=${encodeURIComponent(file.name)}`);
        xhr.send(file);

        uploadPromise.then((response: any) => {
          if (response && typeof response.url === 'string') {
            setImageUrls(prev => [...prev, response.url]);
            setUploadingFiles(prev => ({ 
              ...prev, 
              [uploadId]: { ...prev[uploadId], status: 'completed', progress: 100, url: response.url } 
            }));
            
            // Show success notification
            setNotificationMessage(`Image ${file.name} uploaded successfully`);
            setNotificationType('success');
            setShowNotification(true);
            
            // Auto-hide notification after 3 seconds
            setTimeout(() => {
              setShowNotification(false);
            }, 3000);
            
            // Clear progress for this upload
            setTimeout(() => {
              setUploadingFiles(prev => {
                const newUploading = { ...prev };
                delete newUploading[uploadId];
                return newUploading;
              });
              setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[uploadId];
                return newProgress;
              });
            }, 1500);
          } else {
            throw new Error('Invalid response data');
          }
        }).catch((error) => {
          console.error('Upload error:', error);
          setUploadingFiles(prev => ({ ...prev, [uploadId]: { ...prev[uploadId], status: 'error' } }));
          setUploadErrors(prev => ({
            ...prev,
            [uploadId]: `Failed to upload ${file.name}: ${error.message}`
          }));
          
          // Show error notification
          setNotificationMessage(`Failed to upload ${file.name}`);
          setNotificationType('error');
          setShowNotification(true);
          
          // Auto-hide notification after 3 seconds
          setTimeout(() => {
            setShowNotification(false);
          }, 3000);
        });
      } catch (error: any) {
        console.error('Upload setup error:', error);
        setUploadingFiles(prev => ({ ...prev, [uploadId]: { ...prev[uploadId], status: 'error' } }));
        setUploadErrors(prev => ({
          ...prev,
          [uploadId]: `Error setting up upload for ${file.name}: ${error.message || 'Unknown error'}`
        }));
      }
    }
  }, []);

  const onDropStyling = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      // Check file size - 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        setNotificationMessage(`File ${file.name} exceeds the 5MB size limit`);
        setNotificationType('error');
        setShowNotification(true);
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
        continue;
      }
      
      const uploadId = `styling-${file.name}-${Date.now()}`;
      
      // Show uploading notification
      setNotificationMessage(`Uploading ${file.name}...`);
      setNotificationType('success');
      setShowNotification(true);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch(`/api/uploads?filename=${encodeURIComponent(file.name)}`, {
          method: 'POST',
          body: file,
        });
        
        if (!res.ok) {
          throw new Error(`Upload failed with status ${res.status}`);
        }
        
        const data = await res.json();
        
        if (!data || !data.url) {
          throw new Error('Invalid response data - missing URL');
        }
        
        setStylingIdeas(prev => [...prev, { url: data.url, text: '' }]);
        
        // Show success notification
        setNotificationMessage(`Styling image ${file.name} uploaded successfully`);
        setNotificationType('success');
        setShowNotification(true);
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
      } catch (err: any) {
        console.error('Styling image upload failed:', err);
        
        // Show error notification
        setNotificationMessage(`Failed to upload styling image: ${err.message || 'Unknown error'}`);
        setNotificationType('error');
        setShowNotification(true);
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxFiles: 5 - imageUrls.length,
    maxSize: 5 * 1024 * 1024, // 5MB in bytes
    multiple: true,
  });

  const { getRootProps: getStylingRootProps, getInputProps: getStylingInputProps, isDragActive: isStylingDrag } = useDropzone({
    onDrop: onDropStyling,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxSize: 5 * 1024 * 1024, // 5MB in bytes
    multiple: true,
  });

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
                  : `${5 - imageUrls.length} images remaining (max 5MB per image)`}
              </p>
            </div>

            <div className={styles.imageGrid}>
              {imageUrls.map((url, i) => (
                <div key={`${url}-${i}`} className={styles.imagePreviewContainer}>
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
              {Object.entries(uploadingFiles).map(([uploadId, file]) => (
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
          <h2 className={styles.sectionTitle}><FiImage /> Artful Styling Ideas Images</h2>
          <div className={styles.formGroup}>
            <label className={styles.label}>Styling Inspiration Images</label>
            
            <div {...getStylingRootProps()} className={`${styles.dropzone} ${isStylingDrag ? styles.dropzoneDragActive : ''}`}>
              <input {...getStylingInputProps()} />
              <FiUpload className={styles.dropzoneIcon} />
              <p className={styles.dropzoneText}>
                {isStylingDrag
                  ? 'Drop the images here...'
                  : 'Drag & drop styling inspiration images here, or click to select files (max 5MB per image)'}
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

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}><FiDollarSign /> Pricing</h2>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Price</label>
              <input 
                type="number" 
                value={price} 
                onChange={e => setPrice(Number(e.target.value))} 
                className={styles.input} 
                required 
                min="0"
                step="0.01"
                placeholder="0.00"
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
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}><FiArchive /> Inventory & Details</h2>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Stock</label>
              <input 
                type="number" 
                value={stockQuantity} 
                onChange={e => setStockQuantity(Number(e.target.value))} 
                className={styles.input} 
                required 
                min="0"
                placeholder="Available quantity"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Category</label>
              <select 
                value={categoryId || ''} 
                onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)} 
                className={styles.select}
                required
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.checkbox}>
              <input 
                type="checkbox" 
                id="isActive" 
                checked={isActive} 
                onChange={e => setIsActive(e.target.checked)} 
                className={styles.checkboxInput}
              />
              <span className={styles.checkboxLabel}>Product is active and visible</span>
            </label>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button 
            type="submit" 
            disabled={submitting} 
            className={styles.saveButton}
          >
            <FiSave />
            {submitting ? 'Saving...' : 'Save Changes'} 
            <FiArrowRight className={styles.arrowIcon} />
          </button>
          <button 
            type="button" 
            onClick={() => router.back()} 
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
  );
}
