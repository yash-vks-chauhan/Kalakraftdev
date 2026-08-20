"use client"

import { useMemo, type FormEvent, type ReactNode } from "react"
import { AlertCircle, Loader2 } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  dateInDays,
  daysFromNow,
  formatDate,
  type Coupon,
  type FormState,
} from "./coupon"

/** The spans people actually decide in. Anything else is a calendar. */
const RUNS: { days: number; label: string }[] = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
]

/**
 * New and edit, as five rules rather than five boxes.
 *
 * The desktop form puts type and amount in a `grid-cols-3`, which on a phone
 * gives the type select about 105px and renders it as "Percen…". Here the two
 * types are a switch, because two mutually exclusive options both fit on
 * screen and neither needs hiding behind a tap.
 *
 * Expiry is the other change worth naming: nobody decides "this coupon ends
 * on the 19th", they decide "this runs for a month". The chips set that in one
 * tap and print the date they resolved to, and the picker is still there for
 * the cases that really are calendar-bound.
 */
export function CouponFormSheet({
  open,
  onOpenChange,
  editing,
  form,
  onChange,
  error,
  submitting,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Coupon | null
  form: FormState
  onChange: (patch: Partial<FormState>) => void
  error: string | null
  submitting: boolean
  onSubmit: (e: FormEvent) => void
}) {
  const unlimited = form.usageLimit.trim() === ""

  /* Which run-length chip is lit, if the chosen date happens to be one. */
  const activeRun = useMemo(() => {
    if (!form.expiresAt) return null
    return RUNS.find((r) => dateInDays(r.days) === form.expiresAt)?.days ?? null
  }, [form.expiresAt])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showClose={false}
        className="dashboard-shell max-h-[92vh] gap-0 overflow-hidden rounded-t-xl border-t-hairline p-0 shadow-sheet"
      >
        <span
          aria-hidden
          className="flex shrink-0 cursor-grab justify-center pb-1 pt-2.5 active:cursor-grabbing"
        >
          <span className="h-1 w-9 rounded-full bg-input" />
        </span>

        <div className="flex shrink-0 items-baseline gap-3 border-b px-4 pb-3 pt-1">
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate text-[15px] font-semibold tracking-[-0.012em]">
              {editing ? "Edit coupon" : "New coupon"}
            </SheetTitle>
            <SheetDescription className="truncate font-mono text-[11px] tracking-[0.01em] text-faint">
              {editing
                ? `${editing.usedCount} redeemed so far`
                : "A code shoppers redeem at checkout"}
            </SheetDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="shrink-0 py-1 font-mono text-[11px] tracking-[0.01em] text-foreground disabled:opacity-40"
          >
            Cancel
          </button>
        </div>

        <form
          id="coupon-form"
          onSubmit={onSubmit}
          className="min-h-0 flex-1 overflow-y-auto px-4"
        >
          <FieldRule label="Code" htmlFor="cp-code">
            <input
              id="cp-code"
              value={form.code}
              onChange={(e) => onChange({ code: e.target.value })}
              placeholder="DIWALI25"
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              required
              className="w-full bg-transparent font-mono text-[16px] uppercase tracking-[0.06em] text-foreground outline-none placeholder:tracking-[0.06em] placeholder:text-faint"
            />
          </FieldRule>

          <FieldRule label="Type">
            <div className="inline-flex overflow-hidden rounded-md border border-input">
              {(["percentage", "flat"] as const).map((option) => {
                const on = form.type === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onChange({ type: option })}
                    aria-pressed={on}
                    className={cn(
                      "px-4 py-2 text-[13.5px] transition-colors",
                      on
                        ? "bg-foreground text-background"
                        : "text-muted-foreground active:bg-wash"
                    )}
                  >
                    {option === "percentage" ? "Percentage" : "Flat ₹"}
                  </button>
                )
              })}
            </div>
          </FieldRule>

          <FieldRule
            label={form.type === "percentage" ? "Percentage off" : "Amount off"}
            htmlFor="cp-amount"
          >
            <div className="flex items-baseline gap-2">
              {form.type === "flat" && (
                <span className="text-[16px] text-muted-foreground">₹</span>
              )}
              <input
                id="cp-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step={form.type === "percentage" ? "1" : "0.01"}
                max={form.type === "percentage" ? "100" : undefined}
                value={form.amount}
                onChange={(e) => onChange({ amount: e.target.value })}
                placeholder={form.type === "percentage" ? "25" : "500"}
                required
                className="min-w-0 flex-1 bg-transparent text-[16px] tabular-nums text-foreground outline-none placeholder:text-faint"
              />
              {form.type === "percentage" && (
                <span className="text-[16px] text-muted-foreground">%</span>
              )}
            </div>
          </FieldRule>

          <FieldRule
            label="Expires"
            hint={
              form.expiresAt
                ? `${formatDate(form.expiresAt)} · ${daysFromNow(form.expiresAt)}`
                : "Pick how long it should run."
            }
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {RUNS.map((run) => {
                const on = activeRun === run.days
                return (
                  <button
                    key={run.days}
                    type="button"
                    onClick={() => onChange({ expiresAt: dateInDays(run.days) })}
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[12.5px] transition-colors",
                      on
                        ? "border-foreground bg-foreground text-background"
                        : "border-input text-muted-foreground active:bg-wash"
                    )}
                  >
                    {run.label}
                  </button>
                )
              })}
              {/* The native picker, kept for the dates that really are dates. */}
              <label
                className={cn(
                  "relative inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-[12.5px] transition-colors",
                  form.expiresAt && activeRun === null
                    ? "border-foreground bg-foreground text-background"
                    : "border-input text-muted-foreground active:bg-wash"
                )}
              >
                {form.expiresAt && activeRun === null ? "Custom" : "Pick a date"}
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => onChange({ expiresAt: e.target.value })}
                  required
                  aria-label="Expiry date"
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </FieldRule>

          <FieldRule
            label="Usage limit"
            htmlFor="cp-limit"
            hint="Caps total redemptions across all customers."
          >
            <div className="flex items-center gap-3">
              <input
                id="cp-limit"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={form.usageLimit}
                onChange={(e) => onChange({ usageLimit: e.target.value })}
                placeholder="—"
                disabled={unlimited}
                className="min-w-0 flex-1 bg-transparent text-[16px] tabular-nums text-foreground outline-none placeholder:text-faint disabled:text-faint"
              />
              <button
                type="button"
                role="switch"
                aria-checked={unlimited}
                onClick={() =>
                  onChange({ usageLimit: unlimited ? "100" : "" })
                }
                className="flex shrink-0 items-center gap-2"
              >
                <span className="font-mono text-[11px] tracking-[0.01em] text-faint">
                  Unlimited
                </span>
                <span
                  className={cn(
                    "relative h-[22px] w-[38px] rounded-full transition-colors",
                    unlimited ? "bg-foreground" : "bg-input"
                  )}
                >
                  {/* `left-[2px]` rather than a static position: the knob is
                      inline-level, so with `left:auto` it resolves to the
                      start of an empty line box and lands mid-pill. */}
                  <span
                    className={cn(
                      "absolute left-[2px] top-[2px] size-[18px] rounded-full bg-background transition-transform",
                      unlimited ? "translate-x-[16px]" : "translate-x-0"
                    )}
                  />
                </span>
              </button>
            </div>
          </FieldRule>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="h-4" />
        </form>

        <div className="shrink-0 border-t px-4 pb-safe pt-3">
          <button
            type="submit"
            form="coupon-form"
            disabled={submitting}
            className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-foreground text-[14.5px] font-medium text-background transition-opacity active:opacity-90 disabled:opacity-50"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {editing ? "Save changes" : "Create coupon"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** A label, a value, and the hairline beneath that carries the focus state. */
function FieldRule({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b py-3.5 transition-colors focus-within:border-foreground">
      <label
        htmlFor={htmlFor}
        className="font-mono text-[11px] tracking-[0.01em] text-faint"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-[12px] text-faint">{hint}</p>}
    </div>
  )
}
