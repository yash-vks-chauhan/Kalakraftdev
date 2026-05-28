"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  PackageX,
  Plus,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
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
  const [paymentMethod, setPaymentMethod] = useState<string>("Credit Card")

  const [coupon, setCoupon] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [discount, setDiscount] = useState(0)
  const [couponMessage, setCouponMessage] = useState<string | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

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
      setCouponMessage(`Coupon “${urlCoupon}” applied.`)
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

  async function applyCoupon() {
    setCouponMessage(null)
    setCouponError(null)
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
      if (!res.ok) throw new Error(data.error || "Failed to apply coupon")
      const amount =
        data.type === "percentage"
          ? (subtotal + tax + shippingFee) * (data.amount / 100)
          : data.amount
      setDiscount(amount)
      setAppliedCoupon(data.code || coupon.trim().toUpperCase())
      setCouponMessage(`Coupon applied.`)
    } catch (err: any) {
      setCouponError(err.message || "Invalid code")
      setDiscount(0)
      setAppliedCoupon(null)
    } finally {
      setCouponLoading(false)
    }
  }

  function removeCoupon() {
    setCoupon("")
    setAppliedCoupon(null)
    setDiscount(0)
    setCouponMessage(null)
    setCouponError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!selectedAddressId) {
      setError("Please select a shipping address.")
      return
    }
    setSubmitting(true)
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
      setTimeout(() => {
        clearCart()
        router.push("/checkout/success")
      }, 600)
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
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
    } catch (err: any) {
      setAddrError(err.message)
    } finally {
      setSavingAddress(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Preparing your checkout…
      </main>
    )
  }

  if (cartItems.length === 0) {
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
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
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
              {addrError && <FieldError message={addrError} />}

              {addresses.length === 0 && !showAddForm ? (
                <div className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                  No saved addresses yet. Add one below to continue.
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

              {!showAddForm ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  className="gap-1.5 self-start"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add a new address
                </Button>
              ) : (
                <div className="flex flex-col gap-3 rounded-md border border-dashed bg-background p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">New address</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setShowAddForm(false)}
                      aria-label="Cancel new address"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid gap-3">
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
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveNewAddress}
                      disabled={savingAddress}
                    >
                      {savingAddress && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Save address
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
              {appliedCoupon && discount > 0 ? (
                <div className="flex items-center justify-between gap-2 rounded-md border bg-secondary/40 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      <Tag className="h-3 w-3" />
                      {appliedCoupon}
                    </Badge>
                    <span className="truncate text-xs text-muted-foreground">
                      Saving {formatCurrency(discount)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={removeCoupon}
                    aria-label="Remove promo code"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={coupon}
                    onChange={(e) => {
                      setCoupon(e.target.value.toUpperCase())
                      if (couponError) setCouponError(null)
                    }}
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
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={applyCoupon}
                    disabled={!coupon.trim() || couponLoading}
                  >
                    {couponLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Apply
                  </Button>
                </div>
              )}
              {couponError && <p className="text-xs text-destructive">{couponError}</p>}
              {!couponError && couponMessage && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {couponMessage}
                </p>
              )}
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
