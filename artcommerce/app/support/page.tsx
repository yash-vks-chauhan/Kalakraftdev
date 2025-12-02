"use client";
import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import {
  Upload, X, Send, HelpCircle, Truck, Package, AlertTriangle,
  CheckCircle, Image as ImageIcon, Loader2, ArrowLeft
} from 'lucide-react';
import Image from "next/image";
import ButtonLoader from '../components/ButtonLoader';
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type ValidatedFile = {
  file: File;
  width: number;
  height: number;
};

const MAX_ATTACHMENTS = 4;
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB
const MAX_DIMENSION = 1080;

export default function SupportPage() {
  const { user, token } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [files, setFiles] = useState<ValidatedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [issueCategory, setIssueCategory] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefill and lock name/email if logged in
  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, name: user.fullName, email: user.email }));
    }
  }, [user]);

  // Load last 5 ordered products
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const allProducts: any[] = [];
        data.orders.forEach((order: any) => {
          order.orderItems.forEach((item: any) => allProducts.push(item.product));
        });
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

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const validateImageFile = async (file: File): Promise<ValidatedFile> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image attachments are allowed.");
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error("Each image must be 3MB or smaller.");
    }
    const { width, height } = await getImageDimensions(file);
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      throw new Error("Images must be at most 1080p.");
    }
    return { file, width, height };
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setError(null);
    const remaining = MAX_ATTACHMENTS - files.length;
    if (remaining <= 0) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} images.`);
      return;
    }

    const toProcess = Array.from(e.target.files).slice(0, remaining);
    const validated: ValidatedFile[] = [];

    for (const file of toProcess) {
      try {
        const vf = await validateImageFile(file);
        validated.push(vf);
      } catch (err: any) {
        setError(err.message || "Invalid image selected.");
      }
    }

    setFiles((prev) => [...prev, ...validated]);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!token) {
      setError("Please sign in to contact support.");
      router.push("/auth/login");
      setLoading(false);
      return;
    }

    if (products.length > 0 && !selectedProductId && issueCategory !== 'other') {
      // Optional: enforce product selection only if not 'other' or make it optional
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

      const selectedProduct = products.find((p) => p.id === selectedProductId);
      const autoSubject = issueCategory && selectedProduct
        ? `[${issueCategory}] ${selectedProduct.name}`
        : form.subject || `Support Request: ${issueCategory}`;

      formData.append("subject", autoSubject);
      formData.append("message", form.message);
      if (issueCategory) formData.append("issueCategory", issueCategory);
      if (selectedProductId) formData.append("productId", String(selectedProductId));
      files.forEach(({ file }) => formData.append("files", file));

      const response = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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

  const issueTypes = [
    { value: "delivery", label: "Delivery Issue", icon: Truck, desc: "Late or missing package" },
    { value: "damage", label: "Product Damaged", icon: Package, desc: "Broken or defective item" },
    { value: "expectation", label: "Not As Expected", icon: AlertTriangle, desc: "Quality or description issue" },
    { value: "other", label: "Other Inquiry", icon: HelpCircle, desc: "General questions" },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 pt-24 sm:pt-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
            How can we help you?
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're here to help with any questions or issues you might have.
            Fill out the form below and we'll get back to you shortly.
          </p>
        </motion.div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">

            {/* 1. Issue Category */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs">1</span>
                What's the issue about?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {issueTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = issueCategory === type.value;
                  return (
                    <motion.button
                      key={type.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIssueCategory(type.value)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${isSelected
                        ? 'border-black bg-gray-50 ring-1 ring-black/5'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
                      {isSelected && (
                        <div className="absolute top-3 right-3 text-black">
                          <CheckCircle className="w-5 h-5 fill-current" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </section>

            {/* 2. Product Selection (if available) */}
            <AnimatePresence>
              {products.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs">2</span>
                    Related Product (Optional)
                  </h2>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                    {products.map((prod) => {
                      const images = Array.isArray(prod.imageUrls) ? prod.imageUrls : JSON.parse(prod.imageUrls || "[]");
                      const imgUrl = images[0] || "/images/logo-mask.png";
                      const isSelected = selectedProductId === prod.id;
                      return (
                        <motion.div
                          key={prod.id}
                          whileHover={{ y: -2 }}
                          onClick={() => setSelectedProductId(isSelected ? null : prod.id)}
                          className={`flex-shrink-0 w-40 cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${isSelected ? 'border-black ring-1 ring-black/5' : 'border-gray-100 hover:border-gray-200'
                            }`}
                        >
                          <div className="relative h-28 bg-gray-100">
                            <Image
                              src={imgUrl}
                              alt={prod.name}
                              fill
                              className="object-cover"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                <div className="bg-white rounded-full p-1 shadow-sm">
                                  <CheckCircle className="w-5 h-5 text-black fill-current" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-3 bg-white">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                              {prod.name}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* 3. Details */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs">{products.length > 0 ? 3 : 2}</span>
                Tell us more
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-gray-50/30"
                    required
                    disabled={!!user}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-gray-50/30"
                    required
                    disabled={!!user}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-gray-50/30"
                  required
                  placeholder="Brief summary of the issue"
                />
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-sm font-medium text-gray-700">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-gray-50/30 min-h-[160px] resize-y"
                  required
                  placeholder="Please describe your issue in detail..."
                />
              </div>

              {/* Attachments */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Attachments (Optional)</label>
                <div className="flex flex-wrap gap-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    className="hidden"
                    accept="image/*"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-600 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Add Images
                  </button>
                  <span className="text-xs text-gray-400 self-center">
                    Max 4 images, 3MB each
                  </span>
                </div>

                {files.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    {files.map(({ file }, index) => (
                      <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <div className="aspect-square relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFiles(files.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="p-2 text-xs text-gray-500 truncate px-2">
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-xl font-medium hover:bg-gray-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transform active:scale-[0.98]"
              >
                {loading ? (
                  <ButtonLoader size="small" color="white" />
                ) : (
                  <>
                    <span>Submit Ticket</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
