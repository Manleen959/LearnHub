import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || "").trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "").trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || "").trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "").trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || "").trim(),
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.trim() !== "" &&
  !firebaseConfig.apiKey.includes("your_api_key") &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId.trim() !== ""
);

let app;
let auth = null;
let db = null;
let googleProvider = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== "") {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } else {
    // Graceful fallback for mock preview when user hasn't added .env keys yet
    app = !getApps().length ? initializeApp({
      apiKey: "AIzaSyDummyKeyForPreviewModeOnly12345",
      authDomain: "dummy.firebaseapp.com",
      projectId: "dummy-project",
      storageBucket: "dummy.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:dummy"
    }) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  }
} catch (error) {
  console.warn("Firebase initialization notice:", error);
}

export { app, auth, db, googleProvider };
export default app;
