import type { FirebaseOptions } from 'firebase/app'

const cleanFirebaseEnv = (value: string | undefined) => {
  const trimmed = value?.trim()
  return trimmed || undefined
}

export const firebaseClientConfig: FirebaseOptions = {
  apiKey: cleanFirebaseEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanFirebaseEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanFirebaseEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanFirebaseEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanFirebaseEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanFirebaseEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: cleanFirebaseEnv(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID),
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
