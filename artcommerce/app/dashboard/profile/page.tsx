"use client"

import { useState, FormEvent, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  AlertCircle,
  Upload,
  Plus,
  Trash2,
  Loader2,
  Check,
  Pencil,
  UserRound,
  Shield,
  MapPin,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { useAuth } from "../../contexts/AuthContext"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

interface Address {
  id: number
  label: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  country: string
  createdAt: string
}

const presetAvatars = [
  { name: "Robot", path: "/avatars/robot.svg" },
  { name: "Fox", path: "/avatars/fox.svg" },
  { name: "Owl", path: "/avatars/owl.svg" },
]

type SectionKey = "identity" | "security" | "addresses"

const sections: { key: SectionKey; label: string; description: string; icon: LucideIcon }[] = [
  { key: "identity", label: "Identity", description: "Name, avatar, email", icon: UserRound },
  { key: "security", label: "Security", description: "Password & sign-in", icon: Shield },
  { key: "addresses", label: "Addresses", description: "Saved delivery locations", icon: MapPin },
]

function initialsOf(name?: string) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}:${remaining.toString().padStart(2, "0")}`
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}

function Banner({ kind, message }: { kind: "success" | "error"; message: string }) {
  const Icon = kind === "success" ? CheckCircle2 : AlertCircle
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 text-sm",
        kind === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="leading-snug">{message}</p>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, token, fetchProfile, loading: authLoading } = useAuth()

  const [active, setActive] = useState<SectionKey>("identity")

  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  const [newEmail, setNewEmail] = useState("")
  const [emailOtp, setEmailOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [emailFormOpen, setEmailFormOpen] = useState(false)

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [addresses, setAddresses] = useState<Address[]>([])
  const [addrLoading, setAddrLoading] = useState(true)
  const [addrError, setAddrError] = useState<string | null>(null)
  const [newAddr, setNewAddr] = useState({
    label: "",
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
    country: "",
  })
  const [savingAddress, setSavingAddress] = useState(false)
  const [addressSheetOpen, setAddressSheetOpen] = useState(false)

  const [emailOtpExpiresAt, setEmailOtpExpiresAt] = useState<number | null>(null)
  const [emailRemaining, setEmailRemaining] = useState(0)
  const [passwordOtpExpiresAt, setPasswordOtpExpiresAt] = useState<number | null>(null)
  const [passwordRemaining, setPasswordRemaining] = useState(0)

  const [step, setStep] = useState<"send" | "verify">("send")
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwOpen, setPwOpen] = useState(false)

  const loadAddresses = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch("/api/addresses", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load addresses")
      setAddresses(json.addresses)
    } catch (err: any) {
      setAddrError(err.message)
    } finally {
      setAddrLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (authLoading) return
    if (!token) {
      router.replace("/auth/login")
      return
    }
    loadAddresses()
  }, [authLoading, token, loadAddresses, router])

  useEffect(() => {
    if (!user) return
    setFullName(user.fullName)
    setAvatarUrl(user.avatarUrl || "")
  }, [user])

  useEffect(() => {
    if (!emailOtpExpiresAt) return
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((emailOtpExpiresAt - Date.now()) / 1000))
      setEmailRemaining(remaining)
      if (remaining === 0) {
        setOtpSent(false)
        setEmailOtpExpiresAt(null)
        setEmailOtp("")
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [emailOtpExpiresAt])

  useEffect(() => {
    if (!passwordOtpExpiresAt) return
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((passwordOtpExpiresAt - Date.now()) / 1000))
      setPasswordRemaining(remaining)
      if (remaining === 0) {
        setStep("send")
        setPasswordOtpExpiresAt(null)
        setOtp("")
        setError("OTP for password change has expired. Please request a new one.")
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [passwordOtpExpiresAt])

  const clearStatus = () => {
    setMessage(null)
    setError(null)
  }

  const handleProfileSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      clearStatus()
      setSavingProfile(true)
      try {
        const res = await fetch("/api/auth/update-profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fullName, avatarUrl }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setMessage("Profile updated successfully.")
        setFullName(data.user.fullName)
        setAvatarUrl(data.user.avatarUrl || "")
        await fetchProfile()
      } catch (err: any) {
        setError(err.message)
      } finally {
        setSavingProfile(false)
      }
    },
    [token, fullName, avatarUrl, fetchProfile]
  )

  const handleRequestEmailOtp = useCallback(async () => {
    clearStatus()
    try {
      const res = await fetch("/api/auth/request-email-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOtpSent(true)
      setEmailOtpExpiresAt(Date.now() + 5 * 60 * 1000)
      setEmailRemaining(300)
      setMessage("OTP sent to your current email address.")
    } catch (err: any) {
      setError(err.message)
    }
  }, [token, newEmail])

  const handleConfirmEmailChange = useCallback(async () => {
    clearStatus()
    setConfirming(true)
    try {
      const res = await fetch("/api/auth/confirm-email-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ newEmail, otp: emailOtp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to change email")
      setMessage(`Email changed to ${data.user.email}.`)
      setNewEmail("")
      setEmailOtp("")
      setOtpSent(false)
      setEmailOtpExpiresAt(null)
      setEmailRemaining(0)
      setEmailFormOpen(false)
      await fetchProfile()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConfirming(false)
    }
  }, [token, newEmail, emailOtp, fetchProfile])

  const sendPasswordOtp = useCallback(async () => {
    clearStatus()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/request-password-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStep("verify")
      setPasswordOtpExpiresAt(Date.now() + 5 * 60 * 1000)
      setPasswordRemaining(300)
      setMessage("OTP sent to your email.")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  const handleVerifyPassword = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      clearStatus()
      setLoading(true)
      try {
        const res = await fetch("/api/auth/confirm-password-change", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ otp, newPassword, confirmPassword }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setMessage("Password updated successfully.")
        setNewPassword("")
        setConfirmPassword("")
        setOtp("")
        setStep("send")
        setPwOpen(false)
        await fetchProfile()
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    },
    [token, otp, newPassword, confirmPassword, fetchProfile]
  )

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!token) {
      setError("You need to be logged in to upload an avatar.")
      return
    }
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/uploads", {
      method: "POST",
      body: form,
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || "Failed to upload avatar")
      return
    }
    setAvatarUrl(json.url)
  }

  const handleAddAddress = async (e: FormEvent) => {
    e.preventDefault()
    setSavingAddress(true)
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAddr),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to save address")
      setAddresses([json.address, ...addresses])
      setNewAddr({ label: "", line1: "", line2: "", city: "", postalCode: "", country: "" })
      setAddressSheetOpen(false)
      setMessage("Address saved.")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingAddress(false)
    }
  }

  const handleSetDefault = async (id: number) => {
    await fetch("/api/auth/set-default-address", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ addressId: id }),
    })
    fetchProfile()
  }

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("Delete this address?")) return
    await fetch(`/api/addresses/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    setAddresses(addresses.filter((x) => x.id !== id))
  }

  if (!user) return <ProfileSkeleton />

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="hidden flex-col gap-2 md:flex">
        <p className="text-sm text-muted-foreground">Settings</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Profile
        </h1>
      </header>

      {/* Status banners */}
      {(message || error) && (
        <div className="flex flex-col gap-2">
          {message && <Banner kind="success" message={message} />}
          {error && <Banner kind="error" message={error} />}
        </div>
      )}

      {/* Two-column shell: vertical sub-rail + active section */}
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        {/*
          Mobile: a fixed 3-up segmented control. There are only three
          sections, so the previous horizontally-scrolling pill row hid
          options behind an edge with no affordance for no reason.
          Desktop: the vertical rail with descriptions, sticky.
        */}
        <nav
          aria-label="Profile sections"
          className={cn(
            "grid grid-cols-3 gap-1 rounded-lg border bg-muted/40 p-1",
            "md:sticky md:top-20 md:flex md:flex-col md:self-start md:gap-1",
            "md:rounded-none md:border-0 md:bg-transparent md:p-0 lg:top-6"
          )}
        >
          {sections.map((s) => {
            const isActive = active === s.key
            const Icon = s.icon
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setActive(s.key)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "group min-w-0 rounded-md transition-colors",
                  // Mobile: stacked icon + label, centred, thumb-sized
                  "flex min-h-[3.25rem] flex-col items-center justify-center gap-1 px-1 py-1.5",
                  // Desktop: the original horizontal row
                  "md:min-h-0 md:w-full md:flex-row md:items-center md:justify-start md:gap-3 md:px-3 md:py-2.5 md:text-left",
                  isActive
                    ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 md:bg-secondary md:shadow-none md:ring-0 font-medium"
                    : "text-muted-foreground active:bg-background/60 md:hover:bg-secondary/60 md:hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 md:h-4 md:w-4",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground md:group-hover:text-foreground"
                  )}
                />
                <div className="hidden md:flex md:min-w-0 md:flex-col">
                  <span>{s.label}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {s.description}
                  </span>
                </div>
                <span className="w-full truncate text-center text-[12px] leading-none md:hidden">
                  {s.label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <div className="min-w-0">
          {active === "identity" && (
            <section className="flex flex-col gap-5">
              <SectionHeader
                title="Identity"
                description="Your name and avatar appear across the store."
              />

              <form
                onSubmit={handleProfileSubmit}
                className="flex flex-col gap-5 rounded-lg border bg-card p-4 md:gap-6 md:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <Avatar className="h-20 w-20 border">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                    <AvatarFallback className="bg-secondary text-base font-medium text-foreground">
                      {initialsOf(fullName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-medium text-foreground">Avatar</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {presetAvatars.map((avatar) => (
                        <button
                          key={avatar.name}
                          type="button"
                          onClick={() => setAvatarUrl(avatar.path)}
                          aria-label={`Use ${avatar.name} avatar`}
                          className={cn(
                            "relative flex h-12 w-12 items-center justify-center rounded-md border bg-background transition-colors hover:border-foreground/30",
                            avatarUrl === avatar.path && "border-foreground ring-2 ring-foreground/10"
                          )}
                        >
                          <img src={avatar.path} alt="" className="h-8 w-8" loading="lazy" />
                          {avatarUrl === avatar.path && (
                            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </button>
                      ))}

                      <label className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-md border border-dashed border-input bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="email"
                        type="email"
                        value={user.email}
                        readOnly
                        className="cursor-not-allowed bg-secondary/40 text-muted-foreground"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEmailFormOpen((v) => !v)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {emailFormOpen ? "Cancel" : "Change"}
                      </Button>
                    </div>
                  </div>
                </div>

                {emailFormOpen && (
                  <div className="flex flex-col gap-3 rounded-md border border-dashed bg-background p-4">
                    <p className="text-sm font-medium text-foreground">Change email</p>
                    <div className="grid gap-1.5">
                      <Label htmlFor="newEmail">New email address</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        placeholder="you@example.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                    </div>

                    {!otpSent ? (
                      <div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleRequestEmailOtp}
                          disabled={!newEmail}
                        >
                          Send OTP to current email
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                        <div className="grid gap-1.5">
                          <Label htmlFor="emailOtp">Enter OTP</Label>
                          <Input
                            id="emailOtp"
                            placeholder="6-digit code"
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value)}
                          />
                          {emailRemaining > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Expires in {formatTime(emailRemaining)}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleConfirmEmailChange}
                          disabled={confirming || !emailOtp}
                        >
                          {confirming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Confirm change
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={savingProfile} size="sm">
                    {savingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save changes
                  </Button>
                </div>
              </form>
            </section>
          )}

          {active === "security" && (
            <section className="flex flex-col gap-5">
              <SectionHeader
                title="Security"
                description="Update your password using one-time verification."
              />

              <div className="rounded-lg border bg-card p-4 md:p-6">
                {!pwOpen ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Password</p>
                      <p className="text-sm text-muted-foreground">
                        We&apos;ll send a one-time code to your email to confirm changes.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPwOpen(true)}
                    >
                      Change password
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">Change password</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPwOpen(false)
                          setStep("send")
                          setOtp("")
                          setNewPassword("")
                          setConfirmPassword("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>

                    {step === "send" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={sendPasswordOtp}
                        disabled={loading}
                        className="self-start"
                      >
                        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Send OTP to my email
                      </Button>
                    ) : (
                      <form onSubmit={handleVerifyPassword} className="flex flex-col gap-4">
                        <div className="grid gap-1.5">
                          <Label htmlFor="pwOtp">OTP code</Label>
                          <Input
                            id="pwOtp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.toUpperCase())}
                            required
                          />
                          {passwordRemaining > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Expires in {formatTime(passwordRemaining)}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="grid gap-1.5">
                            <Label htmlFor="newPassword">New password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label htmlFor="confirmPassword">Confirm new password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button type="submit" size="sm" disabled={loading}>
                            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Update password
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {active === "addresses" && (
            <section className="flex flex-col gap-5">
              <div className="flex items-end justify-between gap-4">
                <SectionHeader
                  title="Addresses"
                  description="Saved delivery locations for faster checkout."
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setAddressSheetOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add address
                </Button>
              </div>

              {addrError && <Banner kind="error" message={addrError} />}

              {addrLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-3 rounded-lg border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-1 flex-col gap-1.5">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t pt-2">
                        <Skeleton className="h-7 w-24" />
                        <Skeleton className="h-7 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-card p-8 text-center">
                  <p className="text-sm font-medium text-foreground">No saved addresses yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add an address to speed up your next checkout.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setAddressSheetOpen(true)}
                    className="mt-4"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add your first address
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {addresses.map((a) => {
                    const isDefault = user.defaultAddressId === a.id
                    return (
                      <div
                        key={a.id}
                        className="flex flex-col gap-3 rounded-lg border bg-card p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {a.label}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                              {a.line1}
                              {a.line2 && <>, {a.line2}</>}
                              <br />
                              {a.city}, {a.postalCode}
                              <br />
                              {a.country}
                            </p>
                          </div>
                          {isDefault && (
                            <span className="inline-flex shrink-0 items-center rounded-full border bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">
                              Default
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 border-t pt-2">
                          {!isDefault ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(a.id)}
                            >
                              Make default
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              In use at checkout
                            </span>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAddress(a.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Add-address bottom sheet */}
      <Sheet open={addressSheetOpen} onOpenChange={setAddressSheetOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[90vh] w-full sm:max-w-2xl sm:rounded-t-2xl"
        >
          <SheetHeader className="border-b px-6 pb-4">
            <SheetTitle>New address</SheetTitle>
            <SheetDescription>
              Add a delivery location to your saved addresses.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleAddAddress}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6 pt-4"
          >
            <div className="grid gap-1.5">
              <Label htmlFor="addr-label">Label</Label>
              <Input
                id="addr-label"
                placeholder="Home, Office, etc."
                value={newAddr.label}
                onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="addr-line1">Address line 1</Label>
              <Input
                id="addr-line1"
                placeholder="Street and number"
                value={newAddr.line1}
                onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="addr-line2">Address line 2</Label>
              <Input
                id="addr-line2"
                placeholder="Apartment, suite, landmark (optional)"
                value={newAddr.line2}
                onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="addr-city">City</Label>
                <Input
                  id="addr-city"
                  value={newAddr.city}
                  onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="addr-postal">Postal code</Label>
                <Input
                  id="addr-postal"
                  value={newAddr.postalCode}
                  onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="addr-country">Country</Label>
              <Input
                id="addr-country"
                value={newAddr.country}
                onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })}
                required
              />
            </div>

            <div className="mt-auto flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddressSheetOpen(false)}
                disabled={savingAddress}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingAddress} className="gap-1.5">
                {savingAddress && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save address
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-32" />
      </header>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        {/* Sub-rail */}
        <nav
          aria-hidden
          className={cn(
            "grid grid-cols-3 gap-1 rounded-lg border bg-muted/40 p-1",
            "md:sticky md:top-20 md:flex md:flex-col md:gap-1 md:self-start",
            "md:rounded-none md:border-0 md:bg-transparent md:p-0 lg:top-6"
          )}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[3.25rem] w-full md:h-11" />
          ))}
        </nav>

        {/* Active section */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>

          {/* Avatar row */}
          <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-60" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>

          {/* Field rows */}
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}

          <div className="flex justify-end">
            <Skeleton className="h-9 w-32" />
          </div>
        </section>
      </div>
    </div>
  )
}
