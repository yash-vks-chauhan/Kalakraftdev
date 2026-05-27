// lib/firebase-client.ts
'use client'

import { initializeApp, getApps } from "firebase/app"
import { getAuth }              from "firebase/auth"
import {
  firebaseClientConfig,
  isFirebaseClientConfigured,
  missingFirebaseClientEnv,
} from "./firebase-client-config"

if (!isFirebaseClientConfigured) {
  console.warn(`Firebase client configuration is incomplete. Missing: ${missingFirebaseClientEnv.join(', ')}`)
}

const app = isFirebaseClientConfigured
  ? getApps().length
    ? getApps()[0]
    : initializeApp(firebaseClientConfig)
  : null

// Export the auth instance for use in your app
export const auth = app ? getAuth(app) : null
