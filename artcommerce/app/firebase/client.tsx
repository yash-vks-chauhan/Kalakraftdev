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

const hasAnyEnvFirebaseConfig = Object.values(envFirebaseConfig).some(Boolean)
const missingFirebaseKeys = requiredFirebaseKeys.filter((key) => !envFirebaseConfig[key])

export const firebaseClientConfigError =
  hasAnyEnvFirebaseConfig && missingFirebaseKeys.length > 0
    ? `Firebase client config is incomplete. Missing: ${missingFirebaseKeys.join(', ')}`
    : null

const firebaseConfig = firebaseClientConfigError
  ? null
  : hasAnyEnvFirebaseConfig
    ? envFirebaseConfig
    : defaultFirebaseConfig

const app = firebaseConfig ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig)) : null
export const auth = app ? getAuth(app) : null
export const firebaseProjectId = firebaseConfig?.projectId || null
