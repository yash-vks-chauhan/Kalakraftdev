"use client"

import { useState, useEffect, ChangeEvent, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
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
  Clock,
  ShieldCheck,
} from "lucide-react"

import { useAuth } from "../../contexts/AuthContext"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

export function SupportTicketForm({ redirectBase }: { redirectBase: string }) {
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

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: user.fullName, email: user.email }))
  }, [user])

  useEffect(() => {
    if (!token) return
    ;(async () => {
      try {
        const res = await fetch("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        const all: any[] = []
        data.orders.forEach((order: any) => {
          order.orderItems.forEach((item: any) => all.push(item.product))
        })
        const seen = new Set()
        const unique: any[] = []
        for (const p of all) {
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
        if (!uploadResponse.ok || !uploadData.url)
          throw new Error(uploadData.error || "Failed to upload attachment")
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
      router.push(`${redirectBase}/${data.id}`)
    } catch (err) {
      setError("Something went wrong sending your ticket. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="grid gap-x-8 gap-y-6 p-5 sm:p-6 lg:grid-cols-2">
          {/* LEFT — context */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5">
              <Label className="text-sm font-medium">What&apos;s this about?</Label>
              <div className="grid grid-cols-2 gap-2.5">
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
                        "flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border hover:border-foreground/30 hover:bg-muted/40"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-tight">{type.label}</div>
                        <div
                          className={cn(
                            "truncate text-[11px]",
                            isSelected ? "text-primary-foreground/75" : "text-muted-foreground"
                          )}
                        >
                          {type.desc}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {products.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <Label className="text-sm font-medium">
                  Related item{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <div className="flex gap-2.5 overflow-x-auto pb-1">
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
                        onClick={() => setSelectedProductId(isSelected ? null : prod.id)}
                        className={cn(
                          "w-[84px] shrink-0 overflow-hidden rounded-lg border text-left transition-all",
                          isSelected
                            ? "border-primary ring-1 ring-primary"
                            : "border-border hover:border-foreground/30"
                        )}
                      >
                        <div className="relative h-16 bg-muted">
                          <Image src={imgUrl} alt={prod.name} fill className="object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-foreground/30">
                              <CheckCircle2 className="h-4 w-4 text-background drop-shadow" />
                            </div>
                          )}
                        </div>
                        <div className="bg-card p-1.5">
                          <p className="line-clamp-1 text-[11px] font-medium text-foreground">
                            {prod.name}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Attachments live with context to balance the columns */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                Photos{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
                accept="image/*"
              />
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/40"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-[10px] font-medium">Add</span>
                </button>
                {files.map(({ file }, index) => (
                  <div
                    key={index}
                    className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted"
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
                      className="absolute right-0.5 top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground/70 text-background transition-colors hover:bg-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                A photo speaks volumes. Up to 4 images, 3MB each.
              </p>
            </div>
          </div>

          {/* RIGHT — details */}
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="sup-name">Name</Label>
                <Input
                  id="sup-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  disabled={!!user}
                  placeholder="Your name"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sup-email">Email</Label>
                <Input
                  id="sup-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  disabled={!!user}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="sup-subject">Subject</Label>
              <Input
                id="sup-subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
                placeholder="A short summary, e.g. “Package hasn't arrived”"
              />
            </div>

            <div className="grid flex-1 gap-1.5">
              <Label htmlFor="sup-message">Message</Label>
              <Textarea
                id="sup-message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                placeholder="Walk us through what happened…"
                className="min-h-[132px] flex-1"
              />
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          {error ? (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Replies within a few hours
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Tracked in your dashboard
              </span>
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full gap-2 sm:w-auto">
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
      </Card>
    </form>
  )
}
