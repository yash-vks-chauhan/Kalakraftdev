"use client"

import { useState, useEffect, ChangeEvent, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Upload,
  X,
  HelpCircle,
  Truck,
  Package,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Clock,
  MessageSquare,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { useAuth } from "../contexts/AuthContext"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type ValidatedFile = { file: File; width: number; height: number }

type Attachment = {
  url: string
  type: "image"
  mimeType?: string
  size?: number
  width?: number
  height?: number
  name?: string
  storageProvider?: "cloudinary" | "imagekit"
  storageKey?: string
}

const MAX_ATTACHMENTS = 4
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024 // 3MB
const MAX_DIMENSION = 1080

const issueTypes = [
  { value: "delivery", label: "Delivery", icon: Truck, desc: "Late or missing" },
  { value: "damage", label: "Damaged", icon: Package, desc: "Broken or defective" },
  { value: "expectation", label: "Quality", icon: AlertTriangle, desc: "Not as expected" },
  { value: "other", label: "Other", icon: HelpCircle, desc: "General inquiry" },
]

export default function SupportPage() {
  const { user, token } = useAuth()
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [files, setFiles] = useState<ValidatedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [issueCategory, setIssueCategory] = useState<string>("")
  const [products, setProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Prefill and lock name/email if logged in
  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, name: user.fullName, email: user.email }))
    }
  }, [user])

  // Load last 5 ordered products
  useEffect(() => {
    if (!token) return
    ;(async () => {
      try {
        const res = await fetch("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        const allProducts: any[] = []
        data.orders.forEach((order: any) => {
          order.orderItems.forEach((item: any) => allProducts.push(item.product))
        })
        const seen = new Set()
        const unique: any[] = []
        for (const p of allProducts) {
          if (!seen.has(p.id)) {
            unique.push(p)
            seen.add(p.id)
          }
        }
        setProducts(unique.slice(0, 5))
      } catch (err) {
        console.error("Failed loading previous products", err)
      }
    })()
  }, [token])

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> =>
    new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => resolve({ width: img.width, height: img.height })
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })

  const validateImageFile = async (file: File): Promise<ValidatedFile> => {
    if (!file.type.startsWith("image/")) throw new Error("Only image attachments are allowed.")
    if (file.size > MAX_FILE_SIZE_BYTES) throw new Error("Each image must be 3MB or smaller.")
    const { width, height } = await getImageDimensions(file)
    if (width > MAX_DIMENSION || height > MAX_DIMENSION)
      throw new Error("Images must be at most 1080p.")
    return { file, width, height }
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setError(null)
    const remaining = MAX_ATTACHMENTS - files.length
    if (remaining <= 0) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} images.`)
      return
    }
    const toProcess = Array.from(e.target.files).slice(0, remaining)
    const validated: ValidatedFile[] = []
    for (const file of toProcess) {
      try {
        validated.push(await validateImageFile(file))
      } catch (err: any) {
        setError(err.message || "Invalid image selected.")
      }
    }
    setFiles((prev) => [...prev, ...validated])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!token) {
      setError("Please sign in to contact support.")
      router.push("/auth/login")
      setLoading(false)
      return
    }
    if (!issueCategory) {
      setError("Please pick what your message is about.")
      setLoading(false)
      return
    }

    try {
      const attachments: Attachment[] = []
      for (const { file } of files) {
        const uploadForm = new FormData()
        uploadForm.append("file", file)
        const uploadResponse = await fetch("/api/support/attachments", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: uploadForm,
        })
        const uploadData = await uploadResponse.json().catch(() => ({}))
        if (!uploadResponse.ok || !uploadData.url) {
          throw new Error(uploadData.error || "Failed to upload attachment")
        }
        attachments.push(uploadData as Attachment)
      }

      const selectedProduct = products.find((p) => p.id === selectedProductId)
      const autoSubject =
        issueCategory && selectedProduct
          ? `[${issueCategory}] ${selectedProduct.name}`
          : form.subject || `Support Request: ${issueCategory}`

      const response = await fetch("/api/support/ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: autoSubject,
          message: form.message,
          issueCategory,
          productId: selectedProductId,
          attachments,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to submit ticket")
      }

      const data = await response.json()
      router.push(`/support/ticket/${data.id}`)
    } catch (err) {
      setError("Something went wrong sending your ticket. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const sectionIndex = (() => {
    let i = 0
    return () => (i += 1)
  })()

  return (
    <div className="min-h-screen bg-muted/20 pb-24 pt-24 sm:pt-32">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How can we help?
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            Tell us what&apos;s going on and we&apos;ll make it right. A real person on
            our team will reply — usually within a few hours.
          </p>
        </motion.div>

        {/* Reassurance strip */}
        <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { icon: Clock, text: "Replies within a few hours" },
            { icon: MessageSquare, text: "Chat in real time" },
            { icon: ShieldCheck, text: "Tracked in your dashboard" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-xs text-muted-foreground"
            >
              <Icon className="h-4 w-4 shrink-0 text-foreground" />
              <span>{text}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Issue category */}
          <Card className="shadow-sm">
            <CardHeader className="p-5 sm:p-6">
              <CardTitle>{sectionIndex()}. What&apos;s this about?</CardTitle>
              <CardDescription>Pick the option that fits best.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {issueTypes.map((type) => {
                  const Icon = type.icon
                  const isSelected = issueCategory === type.value
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setIssueCategory(type.value)}
                      aria-pressed={isSelected}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-lg border p-3.5 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card hover:border-foreground/30 hover:bg-muted/40"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="text-sm font-medium">{type.label}</div>
                      <div
                        className={cn(
                          "text-xs",
                          isSelected ? "text-primary-foreground/75" : "text-muted-foreground"
                        )}
                      >
                        {type.desc}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 2. Related product */}
          <AnimatePresence>
            {products.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="shadow-sm">
                  <CardHeader className="p-5 sm:p-6">
                    <CardTitle>{sectionIndex()}. Which item is it about?</CardTitle>
                    <CardDescription>
                      Optional — picking a recent order helps us help you faster.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {products.map((prod) => {
                        const images = Array.isArray(prod.imageUrls)
                          ? prod.imageUrls
                          : JSON.parse(prod.imageUrls || "[]")
                        const imgUrl = images[0] || "/images/logo-mask.png"
                        const isSelected = selectedProductId === prod.id
                        return (
                          <button
                            type="button"
                            key={prod.id}
                            onClick={() =>
                              setSelectedProductId(isSelected ? null : prod.id)
                            }
                            className={cn(
                              "w-28 shrink-0 overflow-hidden rounded-lg border text-left transition-all",
                              isSelected
                                ? "border-primary ring-1 ring-primary"
                                : "border-border hover:border-foreground/30"
                            )}
                          >
                            <div className="relative h-20 bg-muted">
                              <Image
                                src={imgUrl}
                                alt={prod.name}
                                fill
                                className="object-cover"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center bg-foreground/30">
                                  <CheckCircle2 className="h-5 w-5 text-background drop-shadow" />
                                </div>
                              )}
                            </div>
                            <div className="bg-card p-2">
                              <p className="line-clamp-1 text-xs font-medium text-foreground">
                                {prod.name}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3. Details */}
          <Card className="shadow-sm">
            <CardHeader className="p-5 sm:p-6">
              <CardTitle>{sectionIndex()}. Tell us the details</CardTitle>
              <CardDescription>
                The more you share, the quicker we can sort it out.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-5 pt-0 sm:p-6 sm:pt-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    disabled={!!user}
                    placeholder="Your name"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    disabled={!!user}
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              {user && (
                <p className="-mt-2 text-xs text-muted-foreground">
                  Pulled from your account so we know it&apos;s really you.
                </p>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                  placeholder="A short summary, e.g. “Package hasn't arrived”"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  placeholder="Walk us through what happened…"
                  className="min-h-[140px]"
                />
              </div>

              {/* Attachments */}
              <div className="grid gap-2">
                <Label>Attachments</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                  accept="image/*"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-fit gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Add images
                </Button>
                <p className="text-xs text-muted-foreground">
                  A photo speaks volumes. Up to 4 images, 3MB each.
                </p>

                {files.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-1">
                    {files.map(({ file }, index) => (
                      <div
                        key={index}
                        className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                          aria-label="Remove image"
                          className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground/70 text-background transition-colors hover:bg-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              We&apos;ll email you and keep the whole conversation in{" "}
              <Link href="/dashboard/support" className="font-medium text-foreground underline-offset-2 hover:underline">
                your dashboard
              </Link>
              .
            </p>
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full gap-2 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Send to support
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
