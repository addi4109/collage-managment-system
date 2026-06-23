import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDe8ZkyRV57AEZbc8PLx5ftO7Dnk7uSvpE",
  authDomain: "collagemanagmentsystem-d6f81.firebaseapp.com",
  projectId: "collagemanagmentsystem-d6f81",
  storageBucket: "collagemanagmentsystem-d6f81.firebasestorage.app",
  messagingSenderId: "277605189281",
  appId: "1:277605189281:web:af466ae3a678f23c6812e0",
  measurementId: "G-8V5MDGSVV2"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const storage = getStorage(app);

// Force local mocking mode for other collections to prevent Firestore queries
export const isPlaceholder = true;

// Dummy references to satisfy legacy imports without errors
export const db = {} as any;
export const auth = {} as any;

export default app;
