# Security Findings – Artcommerce

## Critical
- [Fixed] Support data is fully public – support/admin ticket endpoints now require auth and enforce owner/admin authorization.
- [Fixed] Order details leak across users – `app/api/orders/[id]/route.ts` now applies scoped ownership checks (`id + userId`) for non-admin users.

## High
- [Fixed] Arbitrary file upload to web root – upload endpoints now require auth/admin controls with server-side validation and guarded storage.
- [Fixed] Admin coupons endpoint exposed – `app/api/admin/coupons/route.ts` now enforces admin auth on `GET` and all write methods.
- [Fixed] Build artifacts committed to source control – tracked `.next/*` files (for example `.next/server/app-paths-manifest.json`) were removed from git index and `.next` is ignored to prevent metadata leakage.
- [Fixed] Order event stream is public – `app/api/orders/stream/route.ts` now requires admin auth, and admin realtime notifications use `private-admin-channel` with server-side auth.
- [Fixed] Secrets and OTPs logged – auth/bootstrap debug logging was cleaned up and OTP secrets are now hashed with verification throttling.

## Medium
- [Fixed] Coupon redemption can be drained – coupon validation endpoint now requires auth and usage count is incremented atomically on order creation.
- [Fixed] Auth tokens in `localStorage` – token persistence moved to HttpOnly cookies + refresh session flow (`AuthContext` no longer stores JWT in localStorage).
- [Fixed] CSV export is injectable – CSV cells are now escaped and formula-prefixed values are neutralized.
- [Fixed] OTP hashing fallback used hardcoded peppers – OTP hashing now requires a configured secret (`OTP_HASH_SECRET` or `JWT_SECRET`, minimum length enforced) and affected reset/email-change endpoints fail closed when misconfigured.
- [Partially Fixed] No rate limiting/abuse controls – strong throttling was added across auth/OTP/social-login/reminder flows; additional global controls can still be expanded to every public endpoint.

## Low
- [Fixed] Missing security headers – `next.config.ts` now sets CSP/HSTS/Referrer-Policy/X-Frame-Options and related hardening headers.
