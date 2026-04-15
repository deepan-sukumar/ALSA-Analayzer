import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
    // Falls back to exact constants during build/client-side bundling if process.env is stripped.
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBJx7LN85nj8sLe-NQGnygZG76O1tXw4OM",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "academic-analyzer-da4d4.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "academic-analyzer-da4d4",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "academic-analyzer-da4d4.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "744214960087",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:744214960087:web:cabd4e94545d153a001d92",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-TQWVDN46EP",
};

// Singleton initialization pattern.
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// SDK Instances.
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

