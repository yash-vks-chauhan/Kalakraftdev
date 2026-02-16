import { createHmac } from 'crypto'

const OTP_SECRET_MIN_LENGTH = 32

type OtpScope = 'password-reset' | 'email-change'

function getConfiguredOtpSecret(): string | null {
  return process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || null
}

export function getOtpSecretValidationError(): string | null {
  const secret = getConfiguredOtpSecret()
  if (!secret) {
    return 'Missing OTP hashing secret. Set OTP_HASH_SECRET (recommended) or JWT_SECRET.'
  }

  if (secret.length < OTP_SECRET_MIN_LENGTH) {
    return `OTP hashing secret must be at least ${OTP_SECRET_MIN_LENGTH} characters.`
  }

  return null
}

export function hashOtpForScope(otp: string, scope: OtpScope): string {
  const secret = getConfiguredOtpSecret()
  if (!secret || secret.length < OTP_SECRET_MIN_LENGTH) {
    throw new Error('OTP hashing secret is not properly configured')
  }

  return createHmac('sha256', secret)
    .update(`${scope}:${otp.trim().toUpperCase()}`)
    .digest('hex')
}
