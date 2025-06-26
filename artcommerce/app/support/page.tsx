// app/support/page.tsx
"use client";
import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import styles from "./support.module.css";
import { FiUpload, FiX, FiSend, FiHelpCircle, FiTruck, FiPackage, FiAlertTriangle } from 'react-icons/fi';
import Image from "next/image";

export default function SupportPage() {
  const { user, token } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [issueCategory, setIssueCategory] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Prefill and lock name/email if logged in
  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, name: user.fullName, email: user.email }));
    }
  }, [user]);

  // Load last 5 ordered products to show as quick-select cards
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        // Flatten products from order items
        const allProducts: any[] = [];
        data.orders.forEach((order: any) => {
          order.orderItems.forEach((item: any) => allProducts.push(item.product));
        });
        // Dedup by product id and take the most recent 5
        const seen = new Set();
        const unique = [] as any[];
        for (const p of allProducts) {
          if (!seen.has(p.id)) {
            unique.push(p);
            seen.add(p.id);
          }
        }
        setProducts(unique.slice(0, 5));
      } catch (err) {
        console.error("Failed loading previous products", err);
      }
    })();
  }, [token]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (products.length > 0 && !selectedProductId) {
      setError("Please select the product related to your issue.");
      setLoading(false);
      return;
    }
    if (!issueCategory) {
      setError("Please select an issue type.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      // Construct a helpful subject automatically if category+product chosen
      const selectedProduct = products.find((p) => p.id === selectedProductId);
      const autoSubject = issueCategory && selectedProduct
        ? `[${issueCategory}] ${selectedProduct.name}`
        : form.subject;
      formData.append("subject", autoSubject);
      formData.append("message", form.message);
      if (issueCategory) formData.append("issueCategory", issueCategory);
      if (selectedProductId) formData.append("productId", String(selectedProductId));
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/support/ticket", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit ticket");
      }

      const data = await response.json();
      router.push(`/support/ticket/${data.id}`);
    } catch (err) {
      setError("Failed to submit ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <FiHelpCircle className={styles.titleIcon} />
          Contact Support
        </h1>
        <p className={styles.subtitle}>
          Need help? We're here to assist you. Fill out the form below and we'll get back to you as soon as possible.
        </p>
      </div>

      <div className={styles.supportCard}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>Name</label>
              <input
                type="text"
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={styles.input}
                required
                disabled={!!user}
                placeholder="Your name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                type="email"
                id="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={styles.input}
                required
                disabled={!!user}
                placeholder="Your email address"
              />
            </div>
          </div>

          {/* Issue category quick options */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Issue type</label>
            <div className={styles.issueOptions}>
              {[
                { value: "delivery", label: "Delivery Problem", Icon: FiTruck },
                { value: "damage", label: "Product Damaged", Icon: FiPackage },
                { value: "expectation", label: "Not As Expected", Icon: FiAlertTriangle },
                { value: "other", label: "Other", Icon: FiHelpCircle },
              ].map(({ value, label, Icon }) => (
                <button
                  type="button"
                  key={value}
                  className={`${styles.issueOption} ${issueCategory === value ? styles.selectedIssue : ""}`}
                  onClick={() => setIssueCategory(value)}
                >
                  <Icon className={styles.issueIcon} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Show previous ordered products */}
          {products.length > 0 && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Which product is this about?</label>
              <div className={styles.productGrid}>
                {products.map((prod) => {
                  const images = Array.isArray(prod.imageUrls) ? prod.imageUrls : JSON.parse(prod.imageUrls || "[]");
                  const imgUrl = images[0] || "/images/logo-mask.png";
                  return (
                    <div
                      key={prod.id}
                      className={`${styles.productCard} ${selectedProductId === prod.id ? styles.selectedProduct : ""}`}
                      onClick={() => setSelectedProductId(prod.id)}
                    >
                      <Image src={imgUrl} alt={prod.name} width={120} height={80} style={{ objectFit: "cover" }} />
                      <span>{prod.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="subject" className={styles.label}>Subject</label>
            <input
              type="text"
              id="subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className={styles.input}
              required
              placeholder="Brief description of your issue"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="message" className={styles.label}>Message</label>
            <textarea
              id="message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className={styles.textarea}
              required
              rows={6}
              placeholder="Please provide details about your issue..."
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Attachments (Optional)</label>
            <div className={styles.fileUpload}>
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                className={styles.fileInput}
                id="file-upload"
              />
              <label htmlFor="file-upload" className={styles.fileLabel}>
                <FiUpload className={styles.uploadIcon} />
                <span>Choose files</span>
              </label>
            </div>
            {files.length > 0 && (
              <div className={styles.fileList}>
                {files.map((file, index) => (
                  <div key={index} className={styles.fileItem}>
                    <span>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, i) => i !== index))}
                      className={styles.removeFile}
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? (
              <div className={styles.loadingSpinner} />
            ) : (
              <>
                <FiSend className={styles.submitIcon} />
                Submit Ticket
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}