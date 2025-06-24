// lib/firebase-client.ts
'use client'

import { initializeApp, getApps } from "firebase/app"
import { getAuth }              from "firebase/auth"

// Your web app’s Firebase config
const firebaseConfig = {
  apiKey:            "AIzaSyCGGjfLkDB7QPE0CODQ6eVSh86GWpDrI9A",
  authDomain:        "kalakraft-b41a3.firebaseapp.com",
  projectId:         "kalakraft-b41a3",
  storageBucket:     "kalakraft-b41a3.appspot.com",
  messagingSenderId: "37104566365",
  appId:              "1:37104566365:web:a4e50eac7489ff895e4db4",
  measurementId:     "G-CGYL0MM4SN",
}

// Initialize Firebase only once
if (!getApps().length) {
  initializeApp(firebaseConfig)
}

// Export the auth instance for use in your app
export const auth = getAuth()