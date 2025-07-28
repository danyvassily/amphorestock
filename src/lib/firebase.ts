import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDx4gKFQtbDFqhZDpZ6gFEJ7JhPeSXPhEc",
  authDomain: "amphore-stock.firebaseapp.com",
  projectId: "amphore-stock",
  storageBucket: "amphore-stock.firebasestorage.app",
  messagingSenderId: "698312579475",
  appId: "1:698312579475:web:f650d691e1ed210e93b066",
  measurementId: "G-7LMYPEWM0T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics (only on client side)
let analytics: any = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { analytics };
export default app; 