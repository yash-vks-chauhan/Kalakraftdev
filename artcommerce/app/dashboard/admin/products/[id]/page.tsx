// File: app/dashboard/admin/products/[id]/page.tsx

'use client'

import { useEffect, useState, FormEvent, useCallback, ChangeEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../../contexts/AuthContext'
import styles from './edit-product.module.css'
import { FiBox, FiDollarSign, FiArchive, FiImage, FiPlusCircle, FiTrash2, FiUploadCloud, FiCheck, FiAlertCircle, FiArrowRight } from 'react-icons/fi'
import { useDropzone } from 'react-dropzone'
import LoadingSpinner from '../../../../components/LoadingSpinner'

interface Product {
  id: number;
  name: string;
  slug: string;
  shortDesc: string;
  description: string;
  price: number;
  currency: string;
  stockQuantity: number;
  isActive: boolean;
  categoryId: number | null;
  imageUrls: string[];
  specifications: string | null;
  careInstructions: string | null;
  stylingIdeaImages: StylingIdea[];
  usageTags: string[];
}

interface UploadingFile {
  id: string;
  name: string;
  preview: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
}

type StylingIdea = { url: string; text: string };

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
  const [categoryId, setCategoryId] = useState<number | null | string>('');
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

  useEffect(() => {
    if (!token) return;

    // Fetch categories
    fetch('/api/categories', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setCategories);

    // Fetch product data
    fetch(`/api/admin/products/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then(json => {
        const p = json.product;
        setName(p.name);
        setSlug(p.slug);
        setShortDesc(p.shortDesc || '');
        setDescription(p.description || '');
        setSpecifications(p.specifications || '');
        setCareInstructions(p.careInstructions || '');

        // Filter out any null/invalid items before setting state
        const cleanStylingIdeas = (p.stylingIdeaImages || []).filter((idea: StylingIdea | null): idea is StylingIdea => !!idea);
        setStylingIdeas(cleanStylingIdeas);
        
        setPrice(p.price);
        setCurrency(p.currency);
        setStockQuantity(p.stockQuantity);
        setIsActive(p.isActive);
        setCategoryId(p.categoryId);

        // Filter out any null/invalid URLs before setting state
        const cleanImageUrls = (p.imageUrls || []).filter((url: string | null): url is string => !!url);
        setImageUrls(cleanImageUrls);

        setUsageTagsInput((p.usageTags || []).join(', '));
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRemoveUpload = (uploadId: string) => {
    setUploadingFiles(prev => {
      const newUploading = { ...prev };
      delete newUploading[uploadId];
      return newUploading;
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
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
            setUploadingFiles(prev => ({
              ...prev,
              [uploadId]: {
                ...prev[uploadId],
                progress
              }
            }));
          }
        };

        const uploadPromise = new Promise((resolve, reject) => {
          xhr.onload = async () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } else {
              reject(new Error('Upload failed'));
            }
          };
          xhr.onerror = () => reject(new Error('Upload failed'));
        });

        xhr.open('POST', `/api/uploads?filename=${file.name}`);
        xhr.send(file);

        uploadPromise.then((url: any) => {
          setImageUrls(prev => [...prev, url.url]);
          setUploadingFiles(prev => ({
            ...prev,
            [uploadId]: { ...prev[uploadId], status: 'completed', progress: 100, url: url.url }
          }));
        }).catch(() => {
           setUploadingFiles(prev => ({ ...prev, [uploadId]: { ...prev[uploadId], status: 'error' } }));
        });
        
      } catch (error) {
        setUploadingFiles(prev => ({
          ...prev,
          [uploadId]: {
            ...prev[uploadId],
            status: 'error',
            progress: 0
          }
        }));
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 5 - imageUrls.length,
  });

  const onDropStyling = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      try {
        const res = await fetch(`/api/uploads?filename=${file.name}`, {
          method: 'POST',
          body: file,
        });
        const data = await res.json();
        setStylingIdeas(prev => [...prev, { url: data.url, text: '' }]);
      } catch (err) {
        console.error('Upload failed', err);
      }
    }
  }, []);

  const { getRootProps: getStylingRootProps, getInputProps: getStylingInputProps, isDragActive: isStylingDrag } = useDropzone({
    onDrop: onDropStyling,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
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
          usageTags: usageTagsInput
            .split(',')
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0),
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Update failed');
      }
      setNotificationType('success');
      setNotificationMessage('Product edited successfully');
      setShowNotification(true);
      setTimeout(() => {
        setIsSaving(true);
        router.push('/dashboard/admin/products');
      }, 1500);
    } catch (err: any) {
      setNotificationType('error');
      setNotificationMessage(err.message);
      setShowNotification(true);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancelClick(e: React.MouseEvent) {
    e.preventDefault();
    setShowCancelModal(true);
  }

  if (isLoading || isSaving) return <LoadingSpinner />;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!product) return <div className={styles.error}>Product not found</div>;

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
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>
            <FiImage className={styles.sectionIcon} />
            Product Images
          </h2>
          <div className={styles.imageGrid}>
            {imageUrls.map((url, index) => (
              <div key={index} className={styles.imagePreview}>
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

          <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}>
            <input {...getInputProps()} />
            <FiUploadCloud className={styles.dropzoneIcon} />
            <p>Drag & drop some files here, or click to select files</p>
            <p className={styles.dropzoneHint}>Max 5 images. Accepted formats: .jpeg, .jpg, .png</p>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>
            <FiDollarSign className={styles.sectionIcon} />
            Pricing
          </h2>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Price</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className={styles.input}
                placeholder="99.99"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Currency</label>
              <input
                type="text"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className={styles.input}
                placeholder="USD"
                required
              />
            </div>
          </div>
        </div>
        
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>
            <FiArchive className={styles.sectionIcon} />
            Inventory & Details
          </h2>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Stock Quantity</label>
              <input
                type="number"
                value={stockQuantity}
                onChange={e => setStockQuantity(Number(e.target.value))}
                className={styles.input}
                placeholder="100"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Category</label>
              <select
                value={categoryId || ''}
                onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                className={styles.select}
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
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
          <button type="button" onClick={handleCancelClick} className={styles.cancelButton}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} className={styles.saveButton}>
            {submitting ? 'Saving...' : 'Save Product'}
            <FiArrowRight className={styles.arrowIcon} />
          </button>
        </div>
      </form>
    </main>
  )
}
