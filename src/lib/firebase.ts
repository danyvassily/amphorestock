import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Configuration Firebase pour Amphore Stock
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDx4gKFQtbDFqhZDpZ6gFEJ7JhPeSXPhEc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "amphore-stock.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "amphore-stock",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "amphore-stock.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "698312579475",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:698312579475:web:f650d691e1ed210e93b066",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-7LMYPEWM0T"
};

// Initialiser Firebase (éviter la double initialisation)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Services Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configuration du provider Google Auth
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Analytics avec protection d'hydration
let analytics: any = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics non disponible:', error);
  }
}

export { analytics };
export default app; 