import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

// Validate that required Firebase config values are present
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('Firebase configuration is missing. Please set environment variables in .env file.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence for Firestore
const enableOfflinePersistence = async () => {
    try {
        await enableIndexedDbPersistence(db);
        // Offline persistence enabled successfully
    } catch (err: any) {
        if (err.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time
        } else if (err.code === 'unimplemented') {
            // The current browser does not support offline persistence
        }
    }
};

// Function to toggle network access (useful for testing offline mode)
const toggleNetworkAccess = async (online: boolean) => {
    if (online) {
        await enableNetwork(db);
    } else {
        await disableNetwork(db);
    }
};

// Initialize offline persistence
enableOfflinePersistence();

// Add some basic error handlers and persistence
auth.onAuthStateChanged((user) => {
    if (user) {
        // Store user data in AsyncStorage for offline access
        AsyncStorage.setItem('user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            lastLoginAt: new Date().toISOString()
        })).catch(() => {
            // Silently handle storage errors
        });
    } else {
        // Clear stored user data
        AsyncStorage.removeItem('user').catch(() => {
            // Silently handle storage errors
        });
    }
}, (error) => {
    // Auth state change error - could be logged to error tracking service in production
});

export { app, auth, db, storage, toggleNetworkAccess }; 