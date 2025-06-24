// File: lib/otpStore.ts
export interface OtpEntry {
    code: string
    expires: number
  }
  
  // OTP valid for 10 minutes
  export const passwordChangeOtpStore: Record<number, OtpEntry> = {}