"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import confetti from "canvas-confetti"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  MapPin,
  PackageX,
  Plus,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  X,
} from "lucide-react"

import { useAuth } from "../contexts/AuthContext"
import { useCart } from "../contexts/CartContext"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
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
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface Address {
  id: number
  label: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  country: string
}

const TAX_RATE = 0.05
const FREE_SHIPPING_THRESHOLD = 100
const FLAT_SHIPPING = 10

const paymentOptions = [
  {
    value: "Credit Card",
    label: "Credit / Debit card",
    description: "Visa, Mastercard, Amex, RuPay",
    icon: CreditCard,
  },
  {
    value: "PayPal",
    label: "PayPal",
    description: "Pay using your PayPal balance",
    icon: Banknote,
  },
  {
    value: "Cash on Delivery",
    label: "Cash on delivery",
    description: "Pay in cash when you receive your order",
    icon: Truck,
  },
] as const

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

function CountUp({ value, duration = 750 }: { value: number; duration?: number }) {
  const [current, setCurrent] = useState(0)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) {
      setCurrent(value)
      return
    }
    const start = performance.now()
    const from = 0
    let raf = 0
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setCurrent(from + (value - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, reducedMotion])

  return <>{formatCurrency(current)}</>
}

export default function CheckoutClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, token } = useAuth()
  const { cartItems, clearCart } = useCart()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [addrLoading, setAddrLoading] = useState(false)
  const [addrError, setAddrError] = useState<string | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAddr, setNewAddr] = useState({
    label: "",
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
    country: "",
  })
  const [savingAddress, setSavingAddress] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [placingPhase, setPlacingPhase] = useState<"idle" | "placing" | "confirmed">("idle")
  const [paymentMethod, setPaymentMethod] = useState<string>("Credit Card")

  const [coupon, setCoupon] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [discount, setDiscount] = useState(0)
  const [couponLoading, setCouponLoading] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const couponBtnRef = useRef<HTMLButtonElement>(null)
  const reducedMotion = useReducedMotion()

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
    [cartItems]
  )
  const tax = useMemo(() => parseFloat((subtotal * TAX_RATE).toFixed(2)), [subtotal])
  const shippingFee = useMemo(
    () => (subtotal > FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING),
    [subtotal]
  )
  const total = useMemo(
    () => Math.max(0, parseFloat((subtotal + tax + shippingFee - discount).toFixed(2))),
    [subtotal, tax, shippingFee, discount]
  )
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    const urlCoupon = searchParams.get("coupon")
    const urlDiscountType = searchParams.get("discountType")
    const urlDiscountAmount = searchParams.get("discountAmount")
    if (urlCoupon && urlDiscountType && urlDiscountAmount) {
      const amount = parseFloat(urlDiscountAmount)
      setCoupon(urlCoupon)
      setAppliedCoupon(urlCoupon)
      setDiscount(
        urlDiscountType === "percentage"
          ? (subtotal + tax + shippingFee) * (amount / 100)
          : amount
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login")
      return
    }
    let cancelled = false
    async function loadAddresses() {
      setAddrLoading(true)
      setAddrError(null)
      try {
        const res = await fetch("/api/addresses", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to load addresses")
        if (cancelled) return
        const list: Address[] = data.addresses || []
        setAddresses(list)
        if (list.length > 0 && !selectedAddressId) {
          const def = list.find((a) => a.id === user?.defaultAddressId)
          setSelectedAddressId(def?.id ?? list[0].id)
        }
      } catch (err: any) {
        if (!cancelled) setAddrError(err.message)
      } finally {
        if (!cancelled) {
          setAddrLoading(false)
          setLoading(false)
        }
      }
    }
    loadAddresses()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, router])

  function celebrate() {
    if (reducedMotion) return
    const el = couponBtnRef.current
    const rect = el?.getBoundingClientRect()
    const origin = rect
      ? {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        }
      : { x: 0.5, y: 0.6 }
    const palette = ["#10b981", "#34d399", "#fbbf24", "#f97316", "#a855f7", "#3b82f6", "#ec4899"]

    // Big initial pop from the button.
    confetti({
      particleCount: 140,
      spread: 90,
      startVelocity: 50,
      origin,
      colors: palette,
      scalar: 1,
      ticks: 260,
      zIndex: 9999,
    })
    // Two side cannons aimed inward for the "explosion" feel.
    confetti({
      particleCount: 70,
      angle: 60,
      spread: 70,
      startVelocity: 55,
      origin: { x: Math.max(0, origin.x - 0.1), y: origin.y },
      colors: palette.slice(0, 4),
      scalar: 0.9,
      zIndex: 9999,
    })
    confetti({
      particleCount: 70,
      angle: 120,
      spread: 70,
      startVelocity: 55,
      origin: { x: Math.min(1, origin.x + 0.1), y: origin.y },
      colors: palette.slice(3),
      scalar: 0.9,
      zIndex: 9999,
    })
    // A delayed second wave with slower, drifty pieces for a longer-lasting moment.
    window.setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 120,
        startVelocity: 30,
        gravity: 0.7,
        decay: 0.94,
        origin,
        colors: palette,
        scalar: 1.05,
        ticks: 300,
        zIndex: 9999,
      })
    }, 220)
  }

  async function applyCoupon() {
    setCouponLoading(true)
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: coupon.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "That code didn't work.")
      const code = (data.code || coupon.trim()).toUpperCase()
      const amount =
        data.type === "percentage"
          ? (subtotal + tax + shippingFee) * (data.amount / 100)
          : data.amount
      setDiscount(amount)
      setAppliedCoupon(code)
      celebrate()
      toast.success(`${code} applied`, {
        description: `You saved ${formatCurrency(amount)} on this order.`,
        duration: 3500,
      })
    } catch (err: any) {
      setDiscount(0)
      setAppliedCoupon(null)
      setShakeKey((k) => k + 1)
      toast.error(err.message || "That code didn't work.", {
        description: "Double-check the code and try again.",
      })
    } finally {
      setCouponLoading(false)
    }
  }

  function removeCoupon() {
    setCoupon("")
    setAppliedCoupon(null)
    setDiscount(0)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!selectedAddressId) {
      setError("Please select a shipping address.")
      return
    }
    setSubmitting(true)
    setPlacingPhase("placing")
    try {
      const payload = {
        addressId: selectedAddressId,
        paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        ...(discount > 0 && (appliedCoupon || coupon.trim())
          ? { couponCode: appliedCoupon || coupon.trim() }
          : {}),
      }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Order failed")
      localStorage.setItem("lastOrderNumber", data.order.orderNumber)
      try {
        localStorage.setItem("lastOrder", JSON.stringify(data.order))
      } catch {
        // ignore storage errors (quota, etc.)
      }

      // Show the success state for a moment before navigating so the user
      // sees a confirmation rather than the empty-cart fallback flashing.
      setPlacingPhase("confirmed")
      await new Promise((resolve) => setTimeout(resolve, 1100))
      clearCart()
      router.push("/checkout/success")
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
      setPlacingPhase("idle")
    }
  }

  async function handleSaveNewAddress(e: React.FormEvent) {
    e.preventDefault()
    setAddrError(null)
    if (!newAddr.line1 || !newAddr.city || !newAddr.postalCode || !newAddr.country) {
      setAddrError("Please complete all required fields.")
      return
    }
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
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save address")
      setAddresses((prev) => [data.address, ...prev])
      setSelectedAddressId(data.address.id)
      setShowAddForm(false)
      setNewAddr({ label: "", line1: "", line2: "", city: "", postalCode: "", country: "" })
      toast.success("Address saved", {
        description: "We'll ship this order here.",
      })
    } catch (err: any) {
      setAddrError(err.message)
    } finally {
      setSavingAddress(false)
    }
  }

  function openAddressSheet() {
    setAddrError(null)
    setShowAddForm(true)
  }

  function closeAddressSheet() {
    if (savingAddress) return
    setAddrError(null)
    setShowAddForm(false)
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Preparing your checkout…
      </main>
    )
  }

  if (cartItems.length === 0 && placingPhase === "idle") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <CheckoutHeader itemCount={0} />
        <Card className="mt-6 shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center sm:p-16">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ShoppingBag className="h-6 w-6" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium text-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">
                Add a few pieces to your cart before checking out.
              </p>
            </div>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/products">
                <ShoppingBag className="h-4 w-4" />
                Browse products
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <>
      {placingPhase !== "idle" && <PlacingOrderOverlay phase={placingPhase} />}
    <main
      className={cn(
        "mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-10",
        placingPhase !== "idle" && "pointer-events-none select-none blur-sm"
      )}
      aria-hidden={placingPhase !== "idle"}
    >
      <CheckoutHeader itemCount={itemCount} />

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
      >
        {/* Left column: address, payment, coupon */}
        <div className="flex flex-col gap-6">
          {/* Shipping address */}
          <Card className="shadow-sm">
            <CardHeader className="gap-1 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border bg-muted/50 text-xs font-semibold">
                  1
                </span>
                Shipping address
              </CardTitle>
              <CardDescription>
                Choose where your order should be delivered.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4 pt-0 sm:p-6 sm:pt-0">
              {addresses.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  No saved addresses yet. Add one to continue.
                  <Button
                    type="button"
                    size="sm"
                    onClick={openAddressSheet}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add an address
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {addresses.map((a) => {
                    const isSelected = selectedAddressId === a.id
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedAddressId(a.id)}
                        aria-pressed={isSelected}
                        className={cn(
                          "group/addr relative flex flex-col items-start gap-2 rounded-lg border bg-background p-4 text-left transition-all duration-200",
                          "hover:border-foreground/30 hover:shadow-sm",
                          isSelected &&
                            "border-foreground ring-2 ring-foreground/10 shadow-sm"
                        )}
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate text-sm font-medium text-foreground">
                              {a.label || "Address"}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                              isSelected
                                ? "border-foreground bg-foreground text-background"
                                : "border-border bg-background text-transparent"
                            )}
                            aria-hidden
                          >
                            <Check className="h-3 w-3" />
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {a.line1}
                          {a.line2 && <>, {a.line2}</>}
                          <br />
                          {a.city}, {a.postalCode}
                          <br />
                          {a.country}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}

              {addresses.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openAddressSheet}
                  className="gap-1.5 self-start"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add a new address
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Add-address bottom sheet */}
          <Sheet open={showAddForm} onOpenChange={(o) => (o ? openAddressSheet() : closeAddressSheet())}>
            <SheetContent
              side="bottom"
              className="mx-auto max-h-[90vh] w-full sm:max-w-2xl sm:rounded-t-2xl"
            >
              <SheetHeader className="border-b px-6 pb-4">
                <SheetTitle>Add a new address</SheetTitle>
                <SheetDescription>
                  Saved to your account so you can reuse it for future orders.
                </SheetDescription>
              </SheetHeader>
              <form
                onSubmit={handleSaveNewAddress}
                className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6 pt-4"
              >
                {addrError && <FieldError message={addrError} />}

                <Field
                  id="addr-label"
                  label="Label"
                  placeholder="Home, Office, etc."
                  value={newAddr.label}
                  onChange={(v) => setNewAddr({ ...newAddr, label: v })}
                />
                <Field
                  id="addr-line1"
                  label="Address line 1"
                  placeholder="Street and number"
                  value={newAddr.line1}
                  onChange={(v) => setNewAddr({ ...newAddr, line1: v })}
                  required
                />
                <Field
                  id="addr-line2"
                  label="Address line 2"
                  placeholder="Apartment, suite, landmark"
                  value={newAddr.line2}
                  onChange={(v) => setNewAddr({ ...newAddr, line2: v })}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    id="addr-city"
                    label="City"
                    value={newAddr.city}
                    onChange={(v) => setNewAddr({ ...newAddr, city: v })}
                    required
                  />
                  <Field
                    id="addr-postal"
                    label="Postal code"
                    value={newAddr.postalCode}
                    onChange={(v) => setNewAddr({ ...newAddr, postalCode: v })}
                    required
                  />
                </div>
                <Field
                  id="addr-country"
                  label="Country"
                  value={newAddr.country}
                  onChange={(v) => setNewAddr({ ...newAddr, country: v })}
                  required
                />

                <div className="mt-auto flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeAddressSheet}
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

          {/* Payment method */}
          <Card className="shadow-sm">
            <CardHeader className="gap-1 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border bg-muted/50 text-xs font-semibold">
                  2
                </span>
                Payment method
              </CardTitle>
              <CardDescription>
                Select how you’d like to pay for this order.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
              <div role="radiogroup" aria-label="Payment method" className="grid gap-2.5">
                {paymentOptions.map((opt) => {
                  const isSelected = paymentMethod === opt.value
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setPaymentMethod(opt.value)}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg border bg-background p-4 text-left transition-all duration-200",
                        "hover:border-foreground/30 hover:shadow-sm",
                        isSelected && "border-foreground ring-2 ring-foreground/10 shadow-sm"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors duration-200",
                          isSelected
                            ? "border-foreground/20 bg-foreground/5 text-foreground"
                            : "bg-muted/50 text-muted-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {opt.label}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {opt.description}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                          isSelected
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background text-transparent"
                        )}
                        aria-hidden
                      >
                        <Check className="h-3 w-3" />
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Coupon */}
          <Card className="shadow-sm">
            <CardHeader className="gap-1 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border bg-muted/50 text-xs font-semibold">
                  3
                </span>
                Promo code
              </CardTitle>
              <CardDescription>Have a code? Apply it to receive a discount.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
              <AnimatePresence mode="wait" initial={false}>
                {appliedCoupon && discount > 0 ? (
                  <motion.div
                    key="applied"
                    initial={{ opacity: 0, scale: 0.97, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: 6 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="relative overflow-hidden rounded-md border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <motion.span
                          initial={{ rotate: -25, scale: 0 }}
                          animate={{ rotate: 0, scale: 1 }}
                          transition={{
                            delay: 0.05,
                            type: "spring",
                            stiffness: 260,
                            damping: 16,
                          }}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          aria-hidden
                        >
                          <Sparkles className="h-4 w-4" />
                        </motion.span>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-mono text-sm font-semibold tracking-wider text-foreground">
                              {appliedCoupon}
                            </span>
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] text-emerald-700 dark:text-emerald-300"
                            >
                              <Check className="h-3 w-3" />
                              Applied
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            You&rsquo;re saving{" "}
                            <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                              <CountUp value={discount} />
                            </span>{" "}
                            on this order.
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeCoupon}
                        aria-label="Remove promo code"
                        className="gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                    {!reducedMotion && (
                      <motion.span
                        aria-hidden
                        initial={{ x: "-110%" }}
                        animate={{ x: "120%" }}
                        transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
                        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10"
                      />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`input-${shakeKey}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={
                      shakeKey > 0
                        ? { opacity: 1, y: 0, x: [0, -7, 6, -4, 3, -2, 0] }
                        : { opacity: 1, y: 0, x: 0 }
                    }
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: shakeKey > 0 ? 0.45 : 0.2, ease: "easeOut" }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE"
                      aria-label="Promo code"
                      className="font-mono tracking-wider"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (coupon.trim() && !couponLoading) applyCoupon()
                        }
                      }}
                    />
                    <Button
                      ref={couponBtnRef}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={applyCoupon}
                      disabled={!coupon.trim() || couponLoading}
                      className="gap-1.5"
                    >
                      {couponLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Tag className="h-3.5 w-3.5" />
                      )}
                      Apply
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Right column: order summary */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="shadow-sm">
            <CardHeader className="gap-1 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="h-4 w-4 text-muted-foreground" />
                Order summary
              </CardTitle>
              <CardDescription>
                {itemCount} item{itemCount === 1 ? "" : "s"} in your order
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 p-4 pt-0 sm:p-6 sm:pt-0">
              {/* Line items */}
              <ul className="flex flex-col gap-3">
                {cartItems.map((item) => {
                  const imageUrl = Array.isArray(item.product.imageUrls)
                    ? item.product.imageUrls[0]
                    : undefined
                  return (
                    <li key={item.id} className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted/40">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <PackageX className="h-4 w-4" />
                          </div>
                        )}
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border bg-background px-1 text-[10px] font-semibold tabular-nums text-foreground shadow-sm">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="line-clamp-1 text-sm font-medium text-foreground">
                          {item.product.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(item.product.price)} each
                        </span>
                      </div>
                      <span className="text-sm font-medium tabular-nums text-foreground">
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </li>
                  )
                })}
              </ul>

              <Separator />

              {/* Totals */}
              <dl className="flex flex-col gap-2 text-sm">
                <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
                <SummaryRow label={`Tax (${Math.round(TAX_RATE * 100)}%)`} value={formatCurrency(tax)} />
                <SummaryRow
                  label="Shipping"
                  value={
                    shippingFee === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                    ) : (
                      formatCurrency(shippingFee)
                    )
                  }
                />
                {discount > 0 && (
                  <SummaryRow
                    label={
                      <span className="flex items-center gap-1.5">
                        Discount
                        {appliedCoupon && (
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {appliedCoupon}
                          </Badge>
                        )}
                      </span>
                    }
                    value={`−${formatCurrency(discount)}`}
                    valueClassName="text-emerald-600 dark:text-emerald-400"
                  />
                )}
              </dl>

              <Separator />

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span
                  aria-live="polite"
                  className="text-xl font-semibold tabular-nums tracking-tight text-foreground"
                >
                  {formatCurrency(total)}
                </span>
              </div>

              {error && <FieldError message={error} />}

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2"
                disabled={submitting || !selectedAddressId || cartItems.length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Placing order…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Place order · {formatCurrency(total)}
                  </>
                )}
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                Secure checkout · Your data is encrypted
              </p>
            </CardContent>
          </Card>

          <Button asChild variant="ghost" size="sm" className="self-center text-muted-foreground">
            <Link href="/dashboard/cart">
              <ArrowLeft className="h-4 w-4" />
              Back to cart
            </Link>
          </Button>
        </div>
      </form>
    </main>
    </>
  )
}

function PlacingOrderOverlay({
  phase,
}: {
  phase: "placing" | "confirmed"
}) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <Card className="w-full max-w-md border-foreground/10 shadow-xl animate-in zoom-in-95 duration-200">
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center sm:p-10">
          {phase === "placing" ? (
            <>
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full ring-1 ring-border"
                />
                <span
                  aria-hidden
                  className="absolute -inset-1.5 rounded-full ring-1 ring-border/40"
                />
                <Loader2 className="h-7 w-7 animate-spin text-foreground" />
              </span>
              <div className="flex flex-col gap-1.5">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Placing your order
                </h2>
                <p className="text-sm text-muted-foreground">
                  Hang tight while we confirm everything — this only takes a moment.
                </p>
              </div>
              <PlacingSteps />
            </>
          ) : (
            <>
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md animate-in zoom-in-50 duration-300">
                <Check className="h-8 w-8" strokeWidth={3} />
              </span>
              <div className="flex flex-col gap-1.5">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Order confirmed
                </h2>
                <p className="text-sm text-muted-foreground">
                  Taking you to your confirmation page…
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PlacingSteps() {
  const steps: { icon: typeof Loader2; label: string }[] = [
    { icon: ShieldCheck, label: "Validating payment" },
    { icon: ShoppingBag, label: "Reserving your items" },
    { icon: Mail, label: "Preparing confirmation email" },
  ]
  return (
    <ul className="flex w-full flex-col gap-2 text-left">
      {steps.map((s, i) => {
        const Icon = s.icon
        return (
          <li
            key={s.label}
            className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2 opacity-0 animate-in fade-in slide-in-from-bottom-2 fill-mode-forwards"
            style={{
              animationDelay: `${i * 280}ms`,
              animationDuration: "320ms",
            }}
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm text-foreground">{s.label}</span>
            <CheckCircle2
              className="h-4 w-4 text-emerald-500 opacity-0 animate-in fade-in zoom-in-50 fill-mode-forwards"
              style={{
                animationDelay: `${i * 280 + 220}ms`,
                animationDuration: "220ms",
              }}
            />
          </li>
        )
      })}
    </ul>
  )
}

function CheckoutHeader({ itemCount }: { itemCount: number }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <Link
          href="/dashboard/cart"
          className="inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to cart
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Checkout
          {itemCount > 0 && (
            <Badge variant="secondary" className="rounded-full">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </Badge>
          )}
        </h1>
        <p className="text-sm text-muted-foreground">
          Confirm your details and place your order securely.
        </p>
      </div>
      <Button asChild variant="outline" size="sm" className="gap-1.5 self-start sm:self-auto">
        <Link href="/products">
          Continue shopping
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </header>
  )
}

function SummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: React.ReactNode
  value: React.ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium tabular-nums text-foreground", valueClassName)}>
        {value}
      </dd>
    </div>
  )
}

function FieldError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <span className="leading-snug">{message}</span>
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  )
}
