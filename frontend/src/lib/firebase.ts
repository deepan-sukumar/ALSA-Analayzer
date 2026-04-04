import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
    // Falls back to a placeholder during build/prerender to prevent the 'invalid-api-key' crash.
    // The real keys must still be added to the Vercel Dashboard for runtime use.
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "UNSET",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Singleton initialization pattern.
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// SDK Instances.
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
