'use client'

import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const defaultFirebaseConfig = {
  apiKey: "AIzaSyCGGjfLkDB7QPE0CODQ6eVSh86GWpDrI9A",
  authDomain: "kalakraft-b41a3.firebaseapp.com",
  projectId: "kalakraft-b41a3",
  storageBucket: "kalakraft-b41a3.appspot.com",
  messagingSenderId: "37104566365",
  appId: "1:37104566365:web:a4e50eac7489ff895e4db4",
  measurementId: "G-CGYL0MM4SN",
}

const envFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() || '',
}

const requiredFirebaseKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
] as const

const envVarNames: Record<(typeof requiredFirebaseKeys)[number], string> = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
}

const hasAnyEnvFirebaseConfig = Object.values(envFirebaseConfig).some(Boolean)
const missingFirebaseKeys = requiredFirebaseKeys.filter((key) => !envFirebaseConfig[key])
const canSafelyFillFromDefault =
  hasAnyEnvFirebaseConfig &&
  missingFirebaseKeys.length > 0 &&
  requiredFirebaseKeys.every((key) => !envFirebaseConfig[key] || envFirebaseConfig[key] === defaultFirebaseConfig[key])

export const firebaseClientConfigError =
  hasAnyEnvFirebaseConfig && missingFirebaseKeys.length > 0 && !canSafelyFillFromDefault
    ? `Firebase client config is incomplete. Missing env vars: ${missingFirebaseKeys
        .map((key) => envVarNames[key])
        .join(', ')}`
    : null

const firebaseConfig = firebaseClientConfigError
  ? null
  : hasAnyEnvFirebaseConfig
    ? canSafelyFillFromDefault
      ? {
          ...defaultFirebaseConfig,
          ...Object.fromEntries(Object.entries(envFirebaseConfig).filter(([, value]) => Boolean(value))),
        }
      : envFirebaseConfig
    : defaultFirebaseConfig

const app = firebaseConfig ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig)) : null
export const auth = app ? getAuth(app) : null
export const firebaseProjectId = firebaseConfig?.projectId || null
