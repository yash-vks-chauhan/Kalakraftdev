# Artcommerce

An e-commerce platform for art products.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory with the following variables:
   ```
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

   # JWT Secret for Authentication
   JWT_SECRET=your_jwt_secret_here

   # Database URL
   DATABASE_URL="postgresql://username:password@hostname:port/database_name"

   # Pusher Configuration (for real-time features)
   PUSHER_APP_ID=your_pusher_app_id
   PUSHER_KEY=your_pusher_key
   PUSHER_SECRET=your_pusher_secret
   PUSHER_CLUSTER=your_pusher_cluster

   # Email Configuration
   EMAIL_SERVER=smtp://username:password@smtp.example.com:587
   EMAIL_FROM=noreply@example.com
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Firebase Authentication Domain Configuration

If you're getting a "Firebase: Error (auth/unauthorized-domain)" error when deploying your application, you need to add your deployed domain to the authorized domains in Firebase:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Authentication > Settings > Authorized domains
4. Add your deployed domain (e.g., `your-app.vercel.app`) to the list of authorized domains
5. Save changes

This will allow Firebase authentication to work on your deployed domain.

## Database Configuration for Production

For production deployment, you need to set up a PostgreSQL database:

1. Create a PostgreSQL database on a platform like:
   - [Supabase](https://supabase.com/) (recommended)
   - [Railway](https://railway.app/)
   - [Neon](https://neon.tech/)
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

2. Get your database connection string in this format:
   ```
   postgresql://username:password@hostname:port/database_name
   ```

3. Add this connection string to your Vercel environment variables:
   - Go to your project in the Vercel dashboard
   - Go to Settings > Environment Variables
   - Add `DATABASE_URL` with your PostgreSQL connection string
   - Make sure to check "Production" environment

4. Deploy your application to apply the database configuration

5. Run the database migrations in the production environment:
   ```bash
   npx prisma migrate deploy
   ```

## Environment Variables for Vercel Deployment

When deploying to Vercel, make sure to add all the required environment variables in your Vercel project settings:

1. Go to your project in the Vercel dashboard
2. Go to Settings > Environment Variables
3. Add all the environment variables from your `.env.local` file
4. Redeploy your application

## Database Setup

The application uses Prisma with PostgreSQL. To set up the database:

```bash
# Generate Prisma client based on your schema
npx prisma generate

# For development - create and apply migrations
npx prisma migrate dev

# For production - apply existing migrations
npx prisma migrate deploy
```

## Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm start`: Start the production server
- `npm run lint`: Run linting checks

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
