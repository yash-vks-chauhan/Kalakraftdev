export type ValidationResult<T> = {
  ok: boolean
  value?: T
  error?: string
}

export function parsePositiveInteger(
  value: unknown,
  fieldName: string,
  options: { max?: number } = {},
): ValidationResult<number> {
  const parsed = typeof value === 'number' ? value : Number(value)
  const max = options.max ?? Number.MAX_SAFE_INTEGER

  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
    return { ok: false, error: `${fieldName} must be an integer between 1 and ${max}` }
  }

  return { ok: true, value: parsed }
}

export function parseNonNegativeMoney(value: unknown, fieldName: string): ValidationResult<number> {
  const parsed = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return { ok: false, error: `${fieldName} must be a non-negative number` }
  }

  return { ok: true, value: Number(parsed.toFixed(2)) }
}

export function clampInteger(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isSafeInteger(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

export function getBoundedString(
  value: unknown,
  fieldName: string,
  maxLength: number,
  options: { required?: boolean } = {},
): ValidationResult<string | null> {
  if (value == null) {
    if (options.required) return { ok: false, error: `${fieldName} is required` }
    return { ok: true, value: null }
  }

  if (typeof value !== 'string') {
    return { ok: false, error: `${fieldName} must be text` }
  }

  const trimmed = value.trim()
  if (options.required && !trimmed) {
    return { ok: false, error: `${fieldName} is required` }
  }

  if (trimmed.length > maxLength) {
    return { ok: false, error: `${fieldName} must be ${maxLength} characters or fewer` }
  }

  return { ok: true, value: trimmed || null }
}

export function isSafeRelativeOrHttpsUrl(value: string): boolean {
  if (value.startsWith('/')) {
    return !value.startsWith('//') && !value.includes('\\')
  }

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}
