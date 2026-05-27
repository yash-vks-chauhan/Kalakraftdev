import type { FirebaseOptions } from 'firebase/app'

export const firebaseClientConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const requiredFirebaseClientEnv = [
  ['NEXT_PUBLIC_FIREBASE_API_KEY', firebaseClientConfig.apiKey],
  ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseClientConfig.authDomain],
  ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', firebaseClientConfig.projectId],
  ['NEXT_PUBLIC_FIREBASE_APP_ID', firebaseClientConfig.appId],
] as const

export const missingFirebaseClientEnv = requiredFirebaseClientEnv
  .filter(([, value]) => !value)
  .map(([name]) => name)

export const isFirebaseClientConfigured = missingFirebaseClientEnv.length === 0
