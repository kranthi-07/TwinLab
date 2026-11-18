// TwinLab Firebase Database & Authentication Client
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if credentials have been populated in .env
export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey && 
    firebaseConfig.projectId && 
    !firebaseConfig.apiKey.includes("your-api-key")
);

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
    try {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        googleProvider = new GoogleAuthProvider();
        console.log("🔥 [TwinLab] Firebase Firestore & Auth successfully connected to project:", firebaseConfig.projectId);
    } catch (err) {
        console.error("❌ [TwinLab] Firebase initialization failed:", err);
    }
} else {
    console.info("ℹ️ [TwinLab] Running in Local Offline Mode. Add your Firebase keys in .env to connect live cloud Firestore database.");
}

export { app, auth, db, googleProvider };
