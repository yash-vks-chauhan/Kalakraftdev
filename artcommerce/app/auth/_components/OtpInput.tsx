"use client"

import { useRef } from "react"

import { cn } from "@/lib/utils"

/**
 * Six boxes for the reset code.
 *
 * The server generates codes from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
 * (see app/api/auth/request-password-change) — no I, O, 0 or 1, because
 * those are the characters people misread. The input filters to the same
 * alphabet, so a misread character is rejected at the keystroke rather
 * than after a round trip.
 *
 * `value` is always a compact prefix: box `i` is filled exactly when
 * `i < value.length`. Focusing a box past the end redirects to the first
 * empty one, which is what keeps holes from ever appearing.
 */

export const OTP_LENGTH = 6

const NOT_IN_ALPHABET = /[^A-HJ-NP-Z2-9]/g

export function normalizeOtp(raw: string): string {
  return raw.toUpperCase().replace(NOT_IN_ALPHABET, "").slice(0, OTP_LENGTH)
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  label = "Reset code",
}: {
  value: string
  onChange: (value: string) => void
  /** Fired once the sixth character lands, from typing or a paste. */
  onComplete?: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  label?: string
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  // The focus guard below runs before React has re-rendered with the new
  // value, so it needs the freshest string rather than the one closed over
  // by the render that attached the handler.
  const latest = useRef(value)
  latest.current = value

  function focusBox(index: number) {
    const clamped = Math.max(0, Math.min(index, OTP_LENGTH - 1))
    refs.current[clamped]?.focus()
    refs.current[clamped]?.select()
  }

  function commit(next: string, caret: number) {
    latest.current = next
    onChange(next)
    focusBox(caret)
    if (next.length === OTP_LENGTH) onComplete?.(next)
  }

  function handleChange(index: number, el: HTMLInputElement) {
    const typed = normalizeOtp(el.value)
    const next = typed
      ? // A password manager or SMS autofill can drop the whole code into a
        // single box, so anything past the first character spills into the rest.
        normalizeOtp(value.slice(0, index) + typed + value.slice(index + typed.length))
      : // The box was emptied — drop everything from here on.
        value.slice(0, index)

    // Re-assert what this box should show. When `next` matches the current
    // value React skips the re-render, and a rejected character (an I or a 0,
    // say) would otherwise sit in the DOM looking accepted.
    el.value = next[index] ?? ''

    commit(next, typed ? index + typed.length : index)
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault()
      if (value[index]) {
        commit(value.slice(0, index), index)
      } else if (index > 0) {
        commit(value.slice(0, index - 1), index - 1)
      }
      return
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      focusBox(index - 1)
    }
    if (e.key === "ArrowRight") {
      e.preventDefault()
      focusBox(Math.min(index + 1, value.length))
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = normalizeOtp(e.clipboardData.getData("text"))
    if (!pasted) return
    commit(pasted, pasted.length)
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center justify-between gap-2"
    >
      {Array.from({ length: OTP_LENGTH }).map((_, index) => {
        const char = value[index] ?? ""
        return (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="text"
            inputMode="text"
            // Only the first box carries the autofill hint; otherwise iOS
            // offers to fill each box with the whole code.
            autoComplete={index === 0 ? "one-time-code" : "off"}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={OTP_LENGTH}
            disabled={disabled}
            aria-label={`Character ${index + 1} of ${OTP_LENGTH}`}
            aria-invalid={invalid || undefined}
            value={char}
            onChange={(e) => handleChange(index, e.target)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => {
              // Never let focus land past the first empty box.
              if (index > latest.current.length) focusBox(latest.current.length)
            }}
            className={cn(
              "h-14 w-full min-w-0 rounded-xl border bg-background text-center",
              "font-mono text-[22px] font-semibold uppercase tracking-normal",
              "transition-[color,box-shadow,border-color,background-color]",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              char && "bg-muted/60",
              invalid
                ? "border-destructive/65 text-destructive"
                : "border-input"
            )}
          />
        )
      })}
    </div>
  )
}
