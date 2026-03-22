import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Prioritize environment variables (for Netlify/Production) 
// Fallback to local config file if env vars are not set
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID,
};

// If env vars are missing, try to load from the local JSON file
// This ensures it still works in this dev environment
if (!firebaseConfig.apiKey) {
  try {
    const localConfig = await import('../firebase-applet-config.json');
    Object.assign(firebaseConfig, localConfig.default || localConfig);
  } catch (e) {
    console.error("Firebase config not found. Please set environment variables.");
  }
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
