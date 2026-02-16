export function isStrongPassword(password: string): boolean {
  if (password.length < 8 || password.length > 128) return false
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)
  return hasLower && hasUpper && hasDigit && hasSymbol
}

export const PASSWORD_POLICY_MESSAGE =
  'Password must be 8-128 characters and include uppercase, lowercase, number, and symbol.'
