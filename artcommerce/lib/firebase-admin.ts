import * as admin from 'firebase-admin'

function normalizePrivateKey(value?: string) {
  return (value || '')
    .trim()
    .replace(/^"+|"+$/g, '')
    .replace(/\\n/g, '\n')
}

function loadServiceAccountConfig() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      return {
        projectId: parsed.project_id || parsed.projectId,
        clientEmail: parsed.client_email || parsed.clientEmail,
        privateKey: normalizePrivateKey(parsed.private_key || parsed.privateKey),
      }
    } catch (error) {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON:', error)
    }
  }

  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  }
}

const firebaseInitError = new Error('Firebase Admin credentials are missing required fields')

if (!admin.apps.length) {
  const config = loadServiceAccountConfig()
  if (config.projectId && config.clientEmail && config.privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      }),
    })
  } else {
    console.warn('Firebase Admin is not configured. Auth endpoints will return errors until credentials are set.')
  }
}

const unconfiguredAuth = {
  verifyIdToken: async () => {
    throw firebaseInitError
  },
} as unknown as admin.auth.Auth

const unconfiguredDb = {
  collection: () => {
    throw firebaseInitError
  },
} as unknown as admin.firestore.Firestore

const hasFirebaseAdminConfig = admin.apps.length > 0

export const auth = hasFirebaseAdminConfig ? admin.auth() : unconfiguredAuth
export const db = hasFirebaseAdminConfig ? admin.firestore() : unconfiguredDb
export const firebaseAdmin = admin
export const isFirebaseAdminConfigured = hasFirebaseAdminConfig
