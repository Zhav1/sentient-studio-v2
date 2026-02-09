import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

export function getFirebaseApp(): FirebaseApp {
    if (!app) {
        const existingApps = getApps();
        if (existingApps.length > 0) {
            app = existingApps[0];
        } else {
            app = initializeApp(firebaseConfig);
        }
    }
    return app;
}

export function getDb(): Firestore {
    if (!db) {
        db = getFirestore(getFirebaseApp());
    }
    return db;
}

export function getFirebaseAuth(): Auth {
    if (!auth) {
        auth = getAuth(getFirebaseApp());
    }
    return auth;
}

// Check if Firebase is configured
export function isFirebaseConfigured(): boolean {
    return Boolean(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    );
}
