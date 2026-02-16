<p align="center">
  <h1 align="center">🎨 KalaKraft</h1>
  <p align="center">
    <strong>A premium e-commerce platform for art products</strong>
  </p>
  <p align="center">
    Built with Next.js 15 · Prisma · PostgreSQL · Firebase Auth · Framer Motion
  </p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#project-structure">Project Structure</a> •
    <a href="#deployment">Deployment</a>
  </p>
</p>

---

## ✨ Features

### 🛍️ Storefront
- **Product Catalog** — Browse art products with infinite scroll, category filters, and sorting
- **Product Details** — Rich product pages with image galleries, specifications, care instructions, styling ideas, and customer reviews
- **Search** — Fuzzy search powered by Fuse.js with an optimized mobile search modal
- **Wishlist** — Save favourite items with animated wishlist interactions
- **Cart & Checkout** — Full cart management, coupon/discount codes, and multi-step checkout flow
- **Order Tracking** — View order history, real-time status updates, and detailed order notes

### 👤 User Dashboard
- **Profile Management** — Edit profile, change email (OTP verified), update password
- **Address Book** — Manage multiple shipping addresses with a default address option
- **Order History** — View past orders with status tracking
- **Wishlist Management** — Dedicated wishlist page with delete animations
- **Support Tickets** — Create and track support requests with message threads and file attachments

### 🔐 Authentication
- **Firebase Auth** — Email/password and Google OAuth sign-in
- **JWT Tokens** — Stateless API authentication with server-side verification
- **Role-Based Access** — `user` and `admin` roles with protected routes

### 🛠️ Admin Panel
- **Product Management** — CRUD operations with image uploads via Cloudinary/ImageKit
- **Order Management** — Update order statuses, add admin notes, track payments
- **User Management** — View, manage, and moderate user accounts
- **Coupon Management** — Create and manage discount codes (percentage or flat)
- **Review Moderation** — Reply to and react to customer reviews
- **Support System** — Respond to support tickets with file attachments
- **Analytics Dashboard** — Sales metrics and visual analytics with Recharts
- **Stock Alerts** — Automated low-stock email notifications via Brevo (Sendinblue)

### 🎨 Design & UX
- **Mobile-First Design** — Fully responsive layouts with dedicated mobile components
- **Glassmorphism UI** — Premium glass-surface design system
- **Framer Motion Animations** — Page transitions, product card animations, staggered menus
- **Three.js Hero Canvas** — 3D interactive hero section
- **Skeleton Loaders** — Optimized loading states across the application
- **Real-Time Notifications** — Powered by Pusher for instant updates

---

## 🧰 Tech Stack

| Layer              | Technology                                                                 |
|--------------------|---------------------------------------------------------------------------|
| **Framework**      | [Next.js 15](https://nextjs.org) (App Router)                            |
| **Language**       | TypeScript                                                                |
| **Database**       | PostgreSQL with [Prisma ORM](https://www.prisma.io)                      |
| **Auth**           | [Firebase Auth](https://firebase.google.com/docs/auth) + JWT             |
| **Styling**        | CSS Modules + [Tailwind CSS](https://tailwindcss.com)                    |
| **Animations**     | [Framer Motion](https://www.framer.com/motion/) + [GSAP](https://gsap.com) |
| **3D Graphics**    | [Three.js](https://threejs.org)                                          |
| **Charts**         | [Recharts](https://recharts.org)                                         |
| **Image Storage**  | [Cloudinary](https://cloudinary.com) / [ImageKit](https://imagekit.io)   |
| **Real-Time**      | [Pusher](https://pusher.com)                                             |
| **Email**          | [Nodemailer](https://nodemailer.com) + [Brevo](https://www.brevo.com)   |
| **Search**         | [Fuse.js](https://fusejs.io)                                            |
| **Deployment**     | [Vercel](https://vercel.com)                                             |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **PostgreSQL** database (local or hosted)
- A **Firebase** project with Authentication enabled

### 1. Clone the Repository

```bash
git clone https://github.com/yash-vks-chauhan/Kalakraftdev.git
cd Kalakraftdev/artcommerce
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file inside the `artcommerce/` directory:

```env
# ─── Firebase ───────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# ─── JWT ────────────────────────────────────────────
JWT_SECRET=your_jwt_secret

# ─── Database ──────────────────────────────────────
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# ─── Pusher (Real-Time) ────────────────────────────
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster

# ─── Email (Transactional) ─────────────────────────
EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
EMAIL_FROM=noreply@example.com

# ─── Brevo / Sendinblue (Admin Alerts) ─────────────
SENDINBLUE_API_KEY=your_api_key
SENDINBLUE_FROM_EMAIL=sender@example.com
ADMIN_EMAIL=admin@example.com
```

### 4. Set Up the Database

```bash
# Generate the Prisma client
npx prisma generate

# Create & apply database migrations (development)
npx prisma migrate dev

# Or apply existing migrations (production)
npx prisma migrate deploy
```

### 5. Run the Development Server

```bash
npm run dev
```

Open **[http://localhost:3002](http://localhost:3002)** in your browser.

---

## 📁 Project Structure

```
artcommerce/
├── app/
│   ├── api/              # Next.js API routes
│   │   ├── admin/        #   Admin endpoints (products, orders, users, coupons, support)
│   │   ├── auth/         #   Authentication (login, register, verify)
│   │   ├── cart/         #   Cart operations
│   │   ├── orders/       #   Order management
│   │   ├── products/     #   Product CRUD & search
│   │   ├── wishlist/     #   Wishlist operations
│   │   └── ...
│   ├── auth/             # Auth pages (login, register, forgot-password)
│   ├── cart/             # Cart page
│   ├── checkout/         # Multi-step checkout
│   ├── components/       # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── MobileLayout.tsx
│   │   ├── GlassSurface.tsx
│   │   ├── ProductCard.tsx
│   │   ├── SearchModal.tsx
│   │   └── ...
│   ├── contexts/         # React context providers (Auth, Cart, Wishlist, Theme)
│   ├── dashboard/        # User dashboard
│   │   ├── admin/        #   Admin panel (products, orders, users, reviews, support)
│   │   ├── orders/       #   Order history
│   │   ├── profile/      #   Profile settings
│   │   ├── wishlist/     #   Wishlist page
│   │   └── support/      #   Support tickets
│   ├── hooks/            # Custom React hooks
│   ├── products/         # Product listing & detail pages
│   └── support/          # Public support / contact page
├── lib/                  # Shared utilities
│   ├── auth.ts           #   JWT helpers
│   ├── prisma.ts         #   Prisma client singleton
│   ├── pusher.ts         #   Pusher client
│   ├── cloudinary.ts     #   Image upload helpers
│   ├── security.ts       #   Security utilities
│   ├── notifications/    #   Email & in-app notification services
│   └── ...
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Migration history
├── public/               # Static assets (images, videos, fonts)
└── scripts/              # Utility scripts
```

---

## 📜 Available Scripts

| Command               | Description                                      |
|----------------------|--------------------------------------------------|
| `npm run dev`        | Start the development server on port 3002        |
| `npm run build`      | Generate Prisma client & build for production     |
| `npm start`          | Start the production server on port 3002          |
| `npm run lint`       | Run ESLint checks                                 |
| `npm run db:generate`| Regenerate the Prisma client                      |
| `npm run db:push`    | Push schema changes directly (no migration)       |
| `npm run db:migrate` | Apply pending Prisma migrations                   |

---

## 🗄️ Database Schema

The application uses **Prisma ORM** with **PostgreSQL**. Key models include:

| Model             | Purpose                                        |
|-------------------|------------------------------------------------|
| `User`            | User accounts with roles, addresses, OTP fields |
| `Product`         | Art products with images, specs, reviews        |
| `Category`        | Hierarchical product categories                 |
| `CartItem`        | User shopping cart items                        |
| `WishlistItem`    | User wishlisted products                        |
| `Order`           | Orders with shipping, billing, payment info     |
| `OrderItem`       | Individual items within an order                |
| `Coupon`          | Discount codes (percentage or flat)             |
| `ProductReview`   | User reviews with admin replies                 |
| `SupportTicket`   | Customer support tickets                        |
| `Notification`    | In-app user notifications                       |
| `StockAlert`      | Low-stock email alert tracking                  |

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Set the **Root Directory** to `artcommerce`
4. Add all environment variables from `.env.local` to the Vercel project settings
5. Deploy — Vercel will run `npm run build` automatically

### Firebase Auth — Authorized Domains

After deploying, add your production domain to Firebase:

1. Go to **[Firebase Console](https://console.firebase.google.com/)** → your project
2. Navigate to **Authentication → Settings → Authorized domains**
3. Add your deployed domain (e.g. `your-app.vercel.app`)

### Production Database

Set up a hosted PostgreSQL instance on one of:
- [Supabase](https://supabase.com/) (recommended)
- [Neon](https://neon.tech/)
- [Railway](https://railway.app/)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

Then add the connection string as `DATABASE_URL` in your Vercel environment variables and run:

```bash
npx prisma migrate deploy
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and not licensed for public distribution.

---

<p align="center">
  Made with ❤️ by the KalaKraft team
</p>
