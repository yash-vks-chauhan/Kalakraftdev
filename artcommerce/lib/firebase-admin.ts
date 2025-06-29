// lib/firebase-admin.ts
import * as admin from 'firebase-admin'

// Check if Firebase Admin has already been initialized
if (!admin.apps.length) {
  const config = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  console.log('Firebase Admin config loaded:', {
    projectIdPresent: Boolean(config.projectId),
    clientEmailPresent: Boolean(config.clientEmail),
    privateKeyPresent: Boolean(config.privateKey)
  });

  try {
    admin.initializeApp({
      credential: admin.credential.cert(config),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    })
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    console.error('Config used:', {
      projectId: config.projectId || 'missing',
      clientEmail: config.clientEmail ? 'present' : 'missing',
      privateKey: config.privateKey ? 'present (length: ' + config.privateKey.length + ')' : 'missing',
      databaseURL: process.env.FIREBASE_DATABASE_URL || 'missing'
    });
  }
}

export const auth = admin.auth()
export const db = admin.firestore()
export const firebaseAdmin = admin;