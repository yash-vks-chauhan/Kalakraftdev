# Artcommerce AI Coding Guide

## Architecture Overview

**Artcommerce** is a Next.js 15 art e-commerce platform with dual-mode mobile/desktop responsive design, real-time notifications, and comprehensive admin features.

### Core Stack
- **Frontend**: Next.js 15 App Router, React 18, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Dual system - Firebase Auth + Custom JWT (see `app/contexts/AuthContext.tsx`)
- **Images**: Cloudinary + ImageKit with automatic optimization
- **Real-time**: Pusher for admin notifications and support tickets
- **Email**: Nodemailer + SendinBlue for transactional emails

## Key Architectural Patterns

### 1. Mobile-First Responsive Architecture
The app uses a unique dual-layout system in `AppRootClient.tsx`:
- Automatic mobile detection via `lib/utils.ts:isMobileDevice()`
- Users can force desktop view (stored in localStorage)
- Mobile-only routes like `/cart/mobile` always use mobile layout
- Components have `-Mobile` variants: `ProductImages.tsx` vs `ProductImagesMobile.tsx`

### 2. Authentication Flow
```typescript
// JWT stored in localStorage + HTTP-only cookies
// Firebase Auth provides Google/social login
// Custom JWT handles API authentication
const { user, token } = useAuth() // Custom JWT context
const { user: firebaseUser } = useFirebaseAuth() // Firebase context
```
**Pattern**: Always use Bearer token in API headers: `Authorization: Bearer ${token}`

### 3. Database Entity Relationships
- Users can have multiple addresses with one default (`defaultAddressId`)
- Products use JSON arrays for `imageUrls` and `usageTags`
- Orders store addresses as JSON objects (not relations)
- Cart/Wishlist are user-specific with composite unique keys
- Reviews are one-per-user-per-product with admin reply support

### 4. Image Optimization Strategy
```typescript
// lib/cloudinaryImages.ts provides helpers
getImageUrl('logo.png') // Falls back: Cloudinary URL → env var → /images/
getOptimizedImageUrl('logo.png', 'c_scale,w_192') // Applies transformations
```
- Auto-optimization in `lib/imageOptimizer.ts` for uploads >1MB
- Scripts in `/scripts/` for batch Cloudinary uploads
- PNG preserved for transparency, JPEG for photos

## Essential Development Patterns

### API Routes Authentication
```typescript
// Standard pattern across all protected routes
function getUserId(request: Request): string | null {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    return (jwt.verify(token, JWT_SECRET!) as any).userId
  } catch { return null }
}

// Admin-only routes
function requireAdmin(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') || ''
  try {
    return (jwt.verify(token, JWT_SECRET!) as any).role === 'admin'
  } catch { return false }
}
```

### Real-time Notifications
- Admin users get Pusher notifications for new orders, low stock, etc.
- Client setup in `components/RealTimeNotifications.tsx`
- Server-side triggers in order creation (`api/orders/route.ts`)
- Context-based notification system in `contexts/NotificationContext.tsx`

### Mobile Context Management
```typescript
// contexts/MobileMenuContext.tsx manages mobile menu state
// Used across Navbar.tsx and MobileLayout.tsx
const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu()
```

## Development Workflow

### Database Operations
```bash
npm run db:generate  # Regenerate Prisma client
npm run db:push      # Push schema to dev DB
npm run db:migrate   # Apply migrations in production
```

### Running the App
```bash
npm run dev          # Starts on port 3002
npm run build        # Includes automatic Prisma generation
```

### Image Management
```bash
node scripts/upload-images.js      # Batch upload to Cloudinary
node scripts/resize-and-upload.js  # Optimize large images first
```

## Critical Integration Points

### Order Processing Pipeline
1. `api/orders/route.ts` - Creates order, decrements stock
2. Sends admin email via SendinBlue (`lib/notifications/sendinblue.ts`)  
3. Triggers Pusher notification to admin dashboard
4. Stock alerts fire if quantities ≤ 5

### Context Provider Hierarchy (see `Providers.tsx`)
```
NotificationProvider
└── AuthProvider (JWT + profile)
    └── MobileMenuProvider
        └── CartProvider (depends on auth)
            └── WishlistProvider (depends on auth)
                └── FirebaseAuthProvider (Google login)
```

### Error Handling
- Global client error display in `AppRootClient.tsx`
- API routes return consistent `{ error: string }` format
- Loading states managed per-context (auth, cart, wishlist)

## File Organization Conventions

- `app/components/` - Shared UI components
- `app/contexts/` - React contexts for state management  
- `app/api/` - API routes following REST patterns
- `lib/` - Utility functions and service integrations
- `prisma/schema.prisma` - Single source of truth for data model
- `scripts/` - Operational scripts for deployment/maintenance

## Environment Variables Required
```bash
# See README.md for complete list
JWT_SECRET=                    # Custom JWT signing
DATABASE_URL=                  # PostgreSQL connection
PUSHER_KEY/SECRET/CLUSTER=     # Real-time notifications
CLOUDINARY_*=                  # Image CDN
FIREBASE_*=                    # Google Auth
SENDINBLUE_API_KEY=           # Email service
```

**Key Note**: Always use `JWT_SECRET` for custom auth, not Firebase tokens for API calls.
