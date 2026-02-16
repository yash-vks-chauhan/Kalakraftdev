import * as admin from 'firebase-admin'

function loadServiceAccountConfig() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      return {
        projectId: parsed.project_id || parsed.projectId,
        clientEmail: parsed.client_email || parsed.clientEmail,
        privateKey: (parsed.private_key || parsed.privateKey || '').replace(/\\n/g, '\n'),
      }
    } catch (error) {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON:', error)
    }
  }

  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
}

if (!admin.apps.length) {
  const config = loadServiceAccountConfig()
  if (!config.projectId || !config.clientEmail || !config.privateKey) {
    throw new Error('Firebase Admin credentials are missing required fields')
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
    }),
  })
}

export const auth = admin.auth()
export const db = admin.firestore()
export const firebaseAdmin = admin
