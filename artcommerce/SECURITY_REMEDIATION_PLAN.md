# Security Remediation Plan – Artcommerce

## Support Tickets
- Require auth on all support routes; derive `userId`/`email` from the token, ignore client-supplied values.
- `POST /api/support/ticket`: logged-in users can create tickets; set owner from token.
- `GET /api/support/my-tickets`: return only the caller’s tickets (`where: { userId }` or `email`).
- `GET /api/support/ticket/[id]`: scope to `{ id, userId }` for normal users; admins can read any.
- `POST /api/support/ticket/[id]`: only owner can add “customer” messages; only admins can add “agent” replies or change status.
- Add ticket status (open/pending/closed) and history (`updatedAt`, `updatedBy` or a history table); show closed tickets read-only.
- Hardening: per-user/IP rate limits; redact PII in logs; return generic errors; use opaque/hashed ticket IDs to reduce enumeration.

## Uploads
- Gate `/api/uploads` with admin auth (Bearer JWT role check); reject non-admins.
- Validate uploads: allow `image/*` only, cap size (~5–10MB), reject double extensions, server-side MIME sniff.
- Store outside `public`; serve via signed URLs/CDN; set explicit `Content-Type`/`Content-Disposition`; strip EXIF; optionally AV-scan.
- For support chat uploads (if allowed), use a separate scoped endpoint with the same validations and non-executable storage.

## SSE / Real-Time
- If needed for admin dashboards: require admin auth per connection (Bearer token), drop PII from payloads, add heartbeat/timeouts, and per-IP connection caps.
- If not required, remove/disable the SSE route to reduce surface area; consider authenticated WebSockets if bidirectional control is needed.

## Auth & Roles
- Centralize Bearer auth + role helpers to avoid drift across routes.
- Prefer short-lived JWTs with refresh via HttpOnly, sameSite cookies instead of localStorage.

## Abuse Controls
- Add rate limiting to login/signup/OTP/support/upload endpoints; introduce CAPTCHA on public forms.

## Security Headers / CSP
- Add HSTS, Frame-Options/Content-Security-Policy/X-Frame-Options, and Referrer-Policy; define a CSP to reduce XSS/clickjacking.
