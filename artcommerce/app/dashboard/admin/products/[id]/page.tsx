// File: app/dashboard/admin/products/[id]/page.tsx

'use client'

import { useEffect, useState, FormEvent, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../../contexts/AuthContext'
import styles from './edit-product.module.css'
import { FiBox, FiDollarSign, FiArchive, FiImage, FiTrash2, FiUploadCloud, FiCheck, FiAlertCircle, FiArrowRight } from 'react-icons/fi'
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
  const [usageTagsInput, setUsageTagsInput] = useState('');

  // UI state
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('success');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, UploadingFile>>({});

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
        }
      })
      .catch(() => setError("Failed to load categories."));

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
        setUsageTagsInput(safeParseUsageTags(p.usageTags).join(', '));
        
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (!file?.name) continue;
      const uploadId = `${file.name}-${file.size}-${Date.now()}`;
      const preview = URL.createObjectURL(file);
      
      setUploadingFiles(prev => ({
        ...prev,
        [uploadId]: { id: uploadId, name: file.name, preview, progress: 0, status: 'uploading' }
      }));

      try {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total);
            setUploadingFiles(prev => ({ ...prev, [uploadId]: { ...prev[uploadId], progress } }));
          }
        };

        const uploadPromise = new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch (e) {
                reject(new Error('Invalid response format'));
              }
            } else {
              reject(new Error('Upload failed'));
            }
          };
          xhr.onerror = () => reject(new Error('Network error'));
        });

        xhr.open('POST', `/api/uploads?filename=${encodeURIComponent(file.name)}`);
        xhr.send(file);

        uploadPromise.then((blob: any) => {
          if (blob && typeof blob.url === 'string') {
            setImageUrls(prev => [...prev, blob.url]);
            setUploadingFiles(prev => ({ 
              ...prev, 
              [uploadId]: { ...prev[uploadId], status: 'completed', progress: 100, url: blob.url } 
            }));
          } else {
            throw new Error('Invalid blob data');
          }
        }).catch(() => {
          setUploadingFiles(prev => ({ ...prev, [uploadId]: { ...prev[uploadId], status: 'error' } }));
        });
      } catch (error) {
        setUploadingFiles(prev => ({ ...prev, [uploadId]: { ...prev[uploadId], status: 'error' } }));
      }
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] } 
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Prepare usage tags from comma-separated string
      const usageTags = usageTagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

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
      
      <form onSubmit={handleSubmit}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}><FiBox /> Basic Information</h2>
          <div className={styles.formGroup}>
            <label>Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className={styles.input} 
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label>Slug</label>
            <input 
              type="text" 
              value={slug} 
              onChange={e => setSlug(e.target.value)} 
              className={styles.input} 
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label>Short Description</label>
            <input 
              type="text" 
              value={shortDesc} 
              onChange={e => setShortDesc(e.target.value)} 
              className={styles.input} 
            />
          </div>
          <div className={styles.formGroup}>
            <label>Full Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className={styles.textarea}
            ></textarea>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}><FiImage /> Product Images</h2>
          <div className={styles.imageGrid}>
            {imageUrls.map((url, index) => (
              <div key={`${url}-${index}`} className={styles.imagePreview}>
                <img src={url} alt={`Product image ${index + 1}`} />
                <button 
                  type="button" 
                  onClick={() => handleRemoveImage(index)} 
                  className={styles.deleteImageButton}
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
          <div {...getRootProps()} className={styles.dropzone}>
            <input {...getInputProps()} />
            <FiUploadCloud />
            <p>Drop images here or click to upload</p>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}><FiDollarSign /> Pricing</h2>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Price</label>
              <input 
                type="number" 
                value={price} 
                onChange={e => setPrice(Number(e.target.value))} 
                className={styles.input} 
                required 
              />
            </div>
            <div className={styles.formGroup}>
              <label>Currency</label>
              <input 
                type="text" 
                value={currency} 
                onChange={e => setCurrency(e.target.value)} 
                className={styles.input} 
                required 
              />
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}><FiArchive /> Inventory & Details</h2>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Stock</label>
              <input 
                type="number" 
                value={stockQuantity} 
                onChange={e => setStockQuantity(Number(e.target.value))} 
                className={styles.input} 
                required 
              />
            </div>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select 
                value={categoryId || ''} 
                onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)} 
                className={styles.select}
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Status</label>
            <div className={styles.checkboxContainer}>
              <input 
                type="checkbox" 
                id="isActive" 
                checked={isActive} 
                onChange={e => setIsActive(e.target.checked)} 
              />
              <label htmlFor="isActive">Product is active and visible</label>
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={() => router.back()} 
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={submitting} 
            className={styles.saveButton}
          >
            {submitting ? 'Saving...' : 'Save Changes'} <FiArrowRight />
          </button>
        </div>
      </form>
    </main>
  );
}
