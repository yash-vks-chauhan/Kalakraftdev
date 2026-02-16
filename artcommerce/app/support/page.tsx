"use client";
import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import {
  Upload, X, Send, HelpCircle, Truck, Package, AlertTriangle,
  CheckCircle2, Image as ImageIcon, Loader2, ArrowLeft, ArrowRight, ChevronRight
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
    { value: "delivery", label: "Delivery", icon: Truck, desc: "Late or missing package" },
    { value: "damage", label: "Damaged", icon: Package, desc: "Broken or defective" },
    { value: "expectation", label: "Quality", icon: AlertTriangle, desc: "Not as expected" },
    { value: "other", label: "Other", icon: HelpCircle, desc: "General inquiry" },
  ];

  return (
    <div className="min-h-screen bg-white pb-20 pt-24 sm:pt-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Contact Support
          </h1>
          <p className="text-gray-500">
            We&apos;re here to help. Tell us what&apos;s wrong and we&apos;ll fix it.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-12">

          {/* 1. Issue Category */}
          <section>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              1. What&apos;s the issue?
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {issueTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = issueCategory === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setIssueCategory(type.value)}
                    className={`group relative p-4 rounded-xl border text-left transition-all ${isSelected
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <Icon className={`w-6 h-6 mb-3 ${isSelected ? 'text-white' : 'text-gray-900'}`} />
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className={`text-xs mt-1 ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}>{type.desc}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Product Selection */}
          <AnimatePresence>
            {products.length > 0 && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                  2. Related Product (Optional)
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {products.map((prod) => {
                    const images = Array.isArray(prod.imageUrls) ? prod.imageUrls : JSON.parse(prod.imageUrls || "[]");
                    const imgUrl = images[0] || "/images/logo-mask.png";
                    const isSelected = selectedProductId === prod.id;
                    return (
                      <div
                        key={prod.id}
                        onClick={() => setSelectedProductId(isSelected ? null : prod.id)}
                        className={`flex-shrink-0 w-32 cursor-pointer rounded-xl border overflow-hidden transition-all ${isSelected ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="relative h-24 bg-gray-100">
                          <Image
                            src={imgUrl}
                            alt={prod.name}
                            fill
                            className="object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <CheckCircle2 className="w-6 h-6 text-white drop-shadow-md" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-white">
                          <p className="text-xs font-medium text-gray-900 line-clamp-1">
                            {prod.name}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* 3. Details */}
          <section>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              {products.length > 0 ? '3. Details' : '2. Details'}
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-0 py-2 border-b border-gray-200 focus:border-black outline-none transition-colors bg-transparent placeholder-gray-300"
                    required
                    disabled={!!user}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-0 py-2 border-b border-gray-200 focus:border-black outline-none transition-colors bg-transparent placeholder-gray-300"
                    required
                    disabled={!!user}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 uppercase">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-0 py-2 border-b border-gray-200 focus:border-black outline-none transition-colors bg-transparent placeholder-gray-300"
                  required
                  placeholder="Brief summary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 uppercase">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-1 focus:ring-black outline-none transition-all min-h-[160px] resize-y placeholder-gray-400"
                  required
                  placeholder="Tell us more about the issue..."
                />
              </div>

              {/* Attachments */}
              <div className="space-y-3">
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
                    className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Attach Images
                  </button>
                </div>

                {files.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {files.map(({ file }, index) => (
                      <div key={index} className="relative group flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                          className="absolute top-1 right-1 p-0.5 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-black" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <ButtonLoader size="small" color="white" />
              ) : (
                <>
                  <span>Submit Ticket</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
