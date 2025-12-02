# Security Findings – Artcommerce

## Critical
- Support data is fully public – `app/api/admin/support/ticket/route.ts` (lines 4-8), `app/api/support/ticket/[id]/route.ts` (lines 5-35), `app/api/support/my-tickets/route.ts` (lines 6-36). Anyone can list/read/post tickets or query arbitrary emails. **Fix:** require auth, enforce ownership (only ticket owner or admin can read/write), and avoid exposing ticket IDs to untrusted users.
- Order details leak across users – `app/api/orders/[id]/route.ts` (lines 34-104) builds a scoped `whereClause` but fetches by id only, so any authenticated user can read any order (addresses, notes, emails). **Fix:** apply the scoped `where` and forbid non-admin access to others’ orders.

## High
- Arbitrary file upload to web root – `app/api/uploads/route.ts` (lines 9-27) allows unauthenticated uploads to `public/uploads`, enabling stored XSS and disk DoS. **Fix:** restrict to admins, validate type/size, store outside the web root, serve via signed URLs.
- Admin coupons endpoint exposed – `app/api/admin/coupons/route.ts` (lines 17-20) lists all coupons without admin checks. **Fix:** enforce admin guard on GET like other methods.
- Order event stream is public – `app/api/orders/stream/route.ts` (lines 6-30) exposes SSE without auth. **Fix:** require admin auth or remove until needed; keep payloads minimal.
- Secrets and OTPs logged – `app/api/auth/me/route.ts` (lines 11-83), `app/api/auth/request-password-change/route.ts` (lines 15-90), `app/api/auth/confirm-password-change/route.ts` (lines 8-48), `app/api/auth/request-email-change/route.ts` (lines 10-82), `lib/firebase-admin.ts` (lines 5-23). Logs include headers/tokens/OTPs/key fragments. **Fix:** remove sensitive logging; hash OTPs if retained.

## Medium
- Coupon redemption can be drained – `app/api/coupons/redeem/route.ts` (lines 6-54) increments `usedCount` without auth. **Fix:** require auth, validate at checkout, decrement only on successful orders (within a transaction).
- Auth tokens in `localStorage` – `app/contexts/AuthContext.tsx` (lines 55-156) stores JWTs client-side, exposed to XSS. **Fix:** prefer HttpOnly, sameSite cookies (or harden CSP and move tokens out of JS storage).
- CSV export is injectable – `app/api/orders/export/route.ts` (lines 16-56) emits raw values; cells starting with `=,+,-,@` can trigger formulas. **Fix:** escape or prefix such values before emitting CSV.
- No rate limiting/abuse controls – login/signup/OTP/email-reset/upload/support endpoints lack throttling. **Fix:** add per-IP/user rate limits, CAPTCHA for public forms, and auth lockouts/backoff.

## Low
- Missing security headers – `next.config.ts` lacks CSP/HSTS/Referrer-Policy/X-Frame-Options. **Fix:** add a hardened header set and CSP to reduce XSS/clickjacking risk.
