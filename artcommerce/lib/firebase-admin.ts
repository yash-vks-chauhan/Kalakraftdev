// lib/firebase-admin.ts
import * as admin from 'firebase-admin'

// Check if Firebase Admin has already been initialized
if (!admin.apps.length) {
  console.log('Firebase Admin Init: projectId', process.env.FIREBASE_PROJECT_ID);
  console.log('Firebase Admin Init: clientEmail', process.env.FIREBASE_CLIENT_EMAIL);
  console.log('Firebase Admin Init: privateKey (first 50 chars)', process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50));
  console.log('Firebase Admin Init: privateKey (last 50 chars)', process.env.FIREBASE_PRIVATE_KEY?.slice(-50));

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    })
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

export const auth = admin.auth()
export const db = admin.firestore()
export const firebaseAdmin = admin;