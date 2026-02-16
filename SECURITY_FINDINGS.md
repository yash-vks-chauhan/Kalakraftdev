# Security Assessment – Artcommerce

Summary of the security issues identified across the codebase. Items are grouped by severity. File paths are repository-relative.

## Critical
- **[Fixed] Plaintext production DB credentials committed** (`vercel.json:6-8`): Secret removed from repo; keep rotated credentials in environment-only configuration.
- **[Fixed] Support tickets lacked auth/authorization** (`app/api/admin/support/ticket/route.ts`, `app/api/admin/support/ticket/[id]/reply/route.ts`, `app/api/support/ticket/[id]/route.ts`, `app/api/support/my-tickets/route.ts`): Endpoints now require auth, enforce ownership/admin role, and Pusher channels are private with server-side auth.
- **Order data exposed to other users** (`app/api/orders/[id]/route.ts`): The computed `whereClause` is unused, so any authenticated user can read any order. Scope queries to `userId` unless admin.
- **Order notes not scoped** (`app/api/orders/[id]/notes/route.ts`): Any authenticated user can read/write notes for any order. Enforce owner/admin checks.
- **Unauthenticated real-time feeds leak PII** (`app/api/orders/stream/route.ts`, `app/api/orders/[id]/status/route.ts`, `app/api/orders/route.ts` + `app/components/RealTimeNotifications.tsx`): Public SSE and public Pusher channel broadcast customer names, totals, and stock events. Require auth on SSE, use private/presence Pusher channels with server-side auth, and strip PII.
- **[Fixed] Unrestricted file uploads** (`app/api/uploads/route.ts`, `app/api/uploads/cloudinary/route.ts`, `app/api/uploads/imagekit/route.ts`): Now require auth, rate limiting, MIME validation, malware scanning, and private/expiring ACLs.

## High
- **Coupons listing endpoint unauthenticated** (`app/api/admin/coupons/route.ts` GET): Exposes all coupons publicly. Require admin auth for all methods.
- **SQL injection risk via string interpolation** (`app/api/admin/products/paginated/route.ts:70-101`): Raw SQL concatenates `search/status/limit/offset`. Parameterize inputs or use Prisma query builder.
- **Auth flows lack brute-force and integrity controls** (`app/api/auth/login/route.ts`, `app/api/auth/signup/route.ts`, `app/api/auth/google-login/route.ts`, `app/api/auth/firebase-login/route.ts`): No rate limiting/lockout, no password strength checks, no email verification, and JWT secrets are assumed present (non-null assertion). Add throttling per IP/user, enforce strong passwords, verify email before activation, and fail fast if `JWT_SECRET` is missing.
- **Role trust solely via self-signed JWT** (all admin `requireAdmin` helpers): Admin access is granted if a token contains `role: 'admin'`; there is no token rotation or audience/issuer check. Ensure tokens are short-lived, signed with a strong secret, optionally include `aud/iss`, and validate against current user role in DB on each admin call.
- **Email-sending endpoints unauthenticated and unthrottled** (`app/api/auth/request-password-change/route.ts`, `app/api/admin/users/[id]/remind-cart/route.ts`): Any caller can trigger emails through Sendinblue/SMTP without captcha or rate limits, enabling spam/credit burn. Require auth or captcha where appropriate and add per-IP/user throttling. *(Support ticket creation is now auth-gated.)*
- **[Fixed] Support real-time channels were public** (Pusher `support-ticket-${id}`): Channels are now private with server-side auth; UI subscribes to `private-support-ticket-*` only for authorized users/admins.
- **[Fixed] Support ticket enumeration/IDOR** (`app/api/support/ticket/[id]/route.ts`, `app/api/support/my-tickets/route.ts`): Endpoints now require auth and enforce ownership/admin checks; unauthorized access returns 401/403/404.
- **OTP/email reset secrets stored & logged in plaintext** (`app/api/auth/request-password-change/route.ts`, `app/api/auth/confirm-password-change/route.ts`, `app/api/auth/request-email-change/route.ts`): Codes persisted and logged alongside emails. Store hashed tokens, stop logging secrets, and add attempt limits.
- **Secrets and hosts logged** (`lib/firebase-admin.ts`, `lib/prisma.ts`, multiple auth routes): Environment presence and DB host printed to logs; leaks through centralized logging. Remove sensitive logging in production.
- **“Secure” endpoint doesn’t verify tokens** (`app/api/secure/hello/route.ts`): Returns `authenticated: true` for any Bearer header without validation. Fix verification or remove to prevent misuse.

## Medium
- **Source maps and lint/type ignores in production** (`next.config.ts:5-11`): `productionBrowserSourceMaps` true and build ignores TS/ESLint errors. Leaks source and masks security bugs. Disable source maps in prod and enforce checks.
- **Overly broad remote image allowlist** (`next.config.ts:14-23`): `remotePatterns` allows any HTTPS host; if user-controlled URLs are rendered, can enable SSRF via image optimizer. Restrict to trusted domains or bypass optimizer for user input.
- **Weak brute-force protections** (auth and OTP endpoints): Login/signup/change-password/OTP routes lack rate limiting and password strength checks. Add IP/user throttling, lockouts/backoff, and enforce password complexity.
- **Forgot-password/OTP robustness gaps**: No per-user/IP throttling, codes are valid for 5 minutes but unlimited attempts, and no device binding. Add rate limiting, attempt counters, and short-lived signed tokens (or hashed codes).
- **Google/Firebase sign-in safeguards** (`app/api/auth/google-login/route.ts`, `app/api/auth/firebase-login/route.ts`): No domain/tenant allowlist or email verification enforcement; accepts any verified Firebase ID token. Consider restricting allowed providers/emails and requiring `email_verified`. Tokens are issued for 7d; shorten to reduce blast radius.
- **Long-lived access tokens without rotation/revocation** (all JWT-based flows): Tokens last 7 days, are reused for admin gating, and there is no refresh/blacklist. Shorten lifetimes, add refresh with rotation, and support server-side revocation on password reset/logout.
- **[Fixed] Support attachments and ticket payloads unvalidated** (`app/api/support/ticket/route.ts`, `app/api/support/ticket/[id]/route.ts`, UI renders attachments in `app/support/ticket/[id]/page.tsx`): Now capped to images only (max 4, 3MB, 1080p) with server-side validation; consider adding malware scanning and safer storage.
