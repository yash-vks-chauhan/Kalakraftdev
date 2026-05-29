"use client"

import { ReactNode, useEffect, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Loader2,
  ShieldCheck,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

/* -------------------------------------------------------------- */
/* Banner — inline error/success/info notice                       */
/* -------------------------------------------------------------- */

const BANNER_ICONS = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
} as const

export function Banner({
  tone,
  children,
}: {
  tone: "error" | "success" | "info"
  children: ReactNode
}) {
  const Icon = BANNER_ICONS[tone]
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-md border px-3.5 py-2.5 text-sm",
        tone === "error" &&
          "border-destructive/30 bg-destructive/10 text-destructive",
        tone === "success" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        tone === "info" && "border-border bg-muted/40 text-foreground"
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="leading-snug">{children}</span>
    </div>
  )
}

/* -------------------------------------------------------------- */
/* PasswordInput — text input with show/hide toggle                */
/* -------------------------------------------------------------- */

export function PasswordInput({
  id,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
  autoComplete = "current-password",
  disabled,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  visible: boolean
  onToggle: () => void
  placeholder: string
  autoComplete?: string
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        required
        className="pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

/* -------------------------------------------------------------- */
/* DividerText — "or continue with"                                */
/* -------------------------------------------------------------- */

export function DividerText({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Separator className="flex-1" />
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {children}
      </span>
      <Separator className="flex-1" />
    </div>
  )
}

/* -------------------------------------------------------------- */
/* SocialButton — Google / Facebook                                */
/* -------------------------------------------------------------- */

export function SocialButton({
  provider,
  loading,
  disabled,
  onClick,
}: {
  provider: "google" | "facebook"
  loading: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="h-10 gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : provider === "google" ? (
        <GoogleIcon />
      ) : (
        <FacebookIcon />
      )}
      <span className="text-sm">
        {loading ? "Connecting…" : provider === "google" ? "Google" : "Facebook"}
      </span>
    </Button>
  )
}

/* -------------------------------------------------------------- */
/* SuccessRedirect — shown after successful submit while routing   */
/* -------------------------------------------------------------- */

export function SuccessRedirect({
  message,
  hint = "Redirecting…",
}: {
  message: string
  hint?: string
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border bg-card py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-6 w-6" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-foreground">{message}</p>
        <p className="inline-flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          {hint}
        </p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- */
/* Icons                                                            */
/* -------------------------------------------------------------- */

/* -------------------------------------------------------------- */
/* OAuthSplash — replaces the form while a Google/Facebook sign-in */
/* is in flight (covers both popup and full-page-redirect paths).  */
/* -------------------------------------------------------------- */

const OAUTH_MESSAGES: Record<"google" | "facebook", string[]> = {
  google: [
    "Opening Google sign-in…",
    "Verifying your Google account…",
    "Linking your Kalakraft profile…",
    "Almost there — preparing your session…",
  ],
  facebook: [
    "Opening Facebook sign-in…",
    "Verifying your Facebook account…",
    "Linking your Kalakraft profile…",
    "Almost there — preparing your session…",
  ],
}

export function OAuthSplash({
  provider,
  onCancel,
}: {
  provider: "google" | "facebook"
  onCancel?: () => void
}) {
  const messages = OAUTH_MESSAGES[provider]
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIdx((i) => (i < messages.length - 1 ? i + 1 : i))
    }, 1400)
    return () => window.clearInterval(id)
  }, [messages])

  const label = provider === "google" ? "Google" : "Facebook"
  const progressPct = ((idx + 1) / messages.length) * 100

  return (
    <div className="flex flex-col gap-5 rounded-xl border bg-card p-6 sm:p-7">
      <div className="flex items-center gap-4">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-foreground/5 ring-1 ring-border">
          <span className="flex h-8 w-8 items-center justify-center">
            {provider === "google" ? (
              <GoogleIconLarge />
            ) : (
              <FacebookIconLarge />
            )}
          </span>
          <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background ring-2 ring-card">
            <Loader2 className="h-3 w-3 animate-spin" />
          </span>
        </div>
        <div className="flex min-w-0 flex-col">
          <h2 className="text-base font-semibold leading-tight sm:text-lg">
            Signing you in with {label}
          </h2>
          <p className="text-sm text-muted-foreground">
            Hold tight — this usually takes a moment.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} sign-in progress`}
        className="relative h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-foreground transition-[width] duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Rotating step message */}
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 text-sm"
      >
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
        <span className="text-foreground">{messages[idx]}</span>
      </div>

      {/* Reassurance */}
      <div className="flex items-start gap-2.5 rounded-lg border bg-muted/30 p-3.5">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-medium text-foreground">
            Your password never leaves {label}
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            We only receive your name, email and avatar — nothing else.
          </p>
        </div>
      </div>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="self-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Cancel and use a different method
        </button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- */
/* Icons                                                            */
/* -------------------------------------------------------------- */

function GoogleIconLarge() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function FacebookIconLarge() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}
