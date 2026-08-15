import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy singletons - Firebase initializes only on first access (client-side).
// This prevents SSR/build-time initialization errors.

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _storage: FirebaseStorage | null = null;

function getApp(): FirebaseApp {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApps()[0];
  } else {
    _app = initializeApp(firebaseConfig);
  }
  return _app;
}

function getDb(): Firestore {
  if (_db) return _db;
  const app = getApp();
  try {
    _db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // Already initialized (hot reload in dev)
    _db = getFirestore(app);
  }
  return _db;
}

function getAuthInstance(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getApp());
  return _auth;
}

function getStorageInstance(): FirebaseStorage {
  if (_storage) return _storage;
  _storage = getStorage(getApp());
  return _storage;
}

// Export getters - access triggers lazy init
export {
  getApp as app,
  getDb as db,
  getAuthInstance as auth,
  getStorageInstance as storage,
};
