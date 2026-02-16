# Security Assessment – Artcommerce

Summary of the security issues identified across the codebase. Items are grouped by severity. File paths are repository-relative.

## Critical
- **[Fixed] Plaintext production DB credentials committed** (`vercel.json:6-8`): Secret removed from repo; keep rotated credentials in environment-only configuration.
- **[Fixed] Support tickets lacked auth/authorization** (`app/api/admin/support/ticket/route.ts`, `app/api/admin/support/ticket/[id]/reply/route.ts`, `app/api/support/ticket/[id]/route.ts`, `app/api/support/my-tickets/route.ts`): Endpoints now require auth, enforce ownership/admin role, and Pusher channels are private with server-side auth.
- **[Fixed] Order data exposed to other users** (`app/api/orders/[id]/route.ts`): Endpoint now applies scoped ownership checks (`id + userId`) for non-admin users.
- **[Fixed] Order notes not scoped** (`app/api/orders/[id]/notes/route.ts`): Notes access is now owner/admin scoped; note creation is admin-restricted.
- **[Fixed] Unauthenticated real-time feeds leak PII** (`app/api/orders/stream/route.ts`, `app/api/orders/[id]/status/route.ts`, `app/api/orders/route.ts` + `app/components/RealTimeNotifications.tsx`): SSE now requires admin auth and Pusher moved to a private admin channel with server-side auth.
- **[Fixed] Unrestricted file uploads** (`app/api/uploads/route.ts`, `app/api/uploads/cloudinary/route.ts`, `app/api/uploads/imagekit/route.ts`): Now require auth, rate limiting, MIME validation, malware scanning, and private/expiring ACLs.

## High
- **[Fixed] Coupons listing endpoint unauthenticated** (`app/api/admin/coupons/route.ts` GET): Admin auth is now required for all coupon methods, including listing.
- **[Fixed] Build artifacts committed to VCS** (`.next/*`, e.g. `.next/server/app-paths-manifest.json`): Removed tracked `.next` artifacts from git and enforced ignore rules to prevent runtime/build metadata leaks in source control.
- **[Fixed] SQL injection risk via string interpolation** (`app/api/admin/products/paginated/route.ts`): Dynamic raw SQL was replaced with Prisma query builder + grouped aggregates.
- **[Partially Fixed] Auth flows lack brute-force and integrity controls** (`app/api/auth/login/route.ts`, `app/api/auth/signup/route.ts`, `app/api/auth/google-login/route.ts`, `app/api/auth/firebase-login/route.ts`): Added per-IP throttling, stronger password policy, shorter signed access tokens, and refresh-session rotation; full first-party email verification flow is still not implemented.
- **[Fixed] Role trust solely via self-signed JWT** (admin guards): Admin routes now validate against current DB role (`requireAdminUser`) rather than trusting JWT claims alone.
- **[Fixed] Email-sending endpoints unauthenticated and unthrottled** (`app/api/auth/request-password-change/route.ts`, `app/api/admin/users/[id]/remind-cart/route.ts`): Password-reset and cart-reminder email triggers now enforce auth/rate-limiting controls.
- **[Fixed] Support real-time channels were public** (Pusher `support-ticket-${id}`): Channels are now private with server-side auth; UI subscribes to `private-support-ticket-*` only for authorized users/admins.
- **[Fixed] Support ticket enumeration/IDOR** (`app/api/support/ticket/[id]/route.ts`, `app/api/support/my-tickets/route.ts`): Endpoints now require auth and enforce ownership/admin checks; unauthorized access returns 401/403/404.
- **[Fixed] OTP/email reset secrets stored & logged in plaintext** (`app/api/auth/request-password-change/route.ts`, `app/api/auth/confirm-password-change/route.ts`, `app/api/auth/request-email-change/route.ts`): OTPs are now hashed at rest with verification throttling and secret logging removed.
- **[Fixed] Secrets and hosts logged** (`lib/firebase-admin.ts`, `lib/prisma.ts`, auth debug routes): Sensitive environment/host debug logs were removed from auth/bootstrap code.
- **[Fixed] “Secure” endpoint doesn’t verify tokens** (`app/api/secure/hello/route.ts`): Endpoint now verifies Firebase ID tokens before returning authenticated responses.

## Medium
- **[Fixed] Source maps and lint/type ignores in production** (`next.config.ts`): Production source maps are disabled, build ignores were removed, and a hardened header set was added.
- **[Fixed] Overly broad remote image allowlist** (`next.config.ts`): Wildcard remote host matching was replaced with explicit trusted domains.
- **[Partially Fixed] Weak brute-force protections** (auth and OTP endpoints): Added throttling for login/signup/social login/password reset/email change/change-password and cart reminders; broader abuse controls can still be expanded to all public-facing forms.
- **[Partially Fixed] Forgot-password/OTP robustness gaps**: Password-reset flow now has per-scope throttling, hashed OTPs, and scoped verification (`auth user` or `email + OTP`), but device/session binding is still not implemented.
- **[Fixed] OTP hashing fallback used hardcoded peppers** (`app/api/auth/request-password-change/route.ts`, `app/api/auth/confirm-password-change/route.ts`, `app/api/auth/request-email-change/route.ts`, `app/api/auth/confirm-email-change/route.ts`): OTP hashing now requires a configured secret (`OTP_HASH_SECRET` or `JWT_SECRET`, minimum length enforced) and fails closed when misconfigured.
- **[Partially Fixed] Google/Firebase sign-in safeguards** (`app/api/auth/google-login/route.ts`, `app/api/auth/firebase-login/route.ts`): `email_verified` is now enforced and optional domain allowlisting is supported via environment config; tenant/domain policy still depends on deployment configuration.
- **[Fixed] Long-lived access tokens without rotation/revocation** (JWT flows): Access tokens are short-lived and refresh sessions are rotated/revoked on refresh/logout/password changes.
- **[Fixed] Support attachments and ticket payloads unvalidated** (`app/api/support/ticket/route.ts`, `app/api/support/ticket/[id]/route.ts`, UI renders attachments in `app/support/ticket/[id]/page.tsx`): Now capped to images only (max 4, 3MB, 1080p) with server-side validation; consider adding malware scanning and safer storage.
