import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { FuelLog } from '../types/fuel';

// Your web app's Firebase configuration
// This reads from .env.local for security and easy setup.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase only if it hasn't been initialized already (Next.js SSR support)
let app;
export let db: any;
export let auth: any;

try {
  if (!getApps().length && firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
  } else if (getApps().length > 0) {
    app = getApp();
  }
  
  if (app) {
    db = getFirestore(app);
    auth = getAuth(app);
  } else {
    // Provide a dummy mock for SSR build if keys are missing
    db = {} as any;
    auth = {} as any;
  }
} catch (error) {
  console.error("Firebase init error:", error);
  db = {} as any;
  auth = {} as any;
}

// --------------------------------------------------------
// FIRESTORE CRUD OPERATIONS FOR FUEL LOGS
// --------------------------------------------------------

const FUEL_LOGS_COLLECTION = 'fuel_logs';

/**
 * Adds a new fuel log to Firestore.
 */
export async function addFuelLogToFirebase(log: Omit<FuelLog, 'id'>): Promise<string> {
  // Enforce auth check before writing
  if (!auth.currentUser) {
    throw new Error("Unauthorized: You must be logged in as the owner to add logs.");
  }

  try {
    const docRef = await addDoc(collection(db, FUEL_LOGS_COLLECTION), log);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document to Firebase: ", error);
    throw error;
  }
}

/**
 * Fetches all fuel logs from Firestore, ordered by Date (newest first).
 */
export async function fetchFuelLogsFromFirebase(): Promise<FuelLog[]> {
  try {
    const q = query(collection(db, FUEL_LOGS_COLLECTION), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const logs: FuelLog[] = [];
    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() } as FuelLog);
    });
    return logs;
  } catch (error) {
    console.error("Error fetching documents from Firebase: ", error);
    return [];
  }
}

/**
 * Subscribes to real-time updates from Firestore.
 */
export function subscribeToFuelLogs(callback: (logs: FuelLog[]) => void) {
  if (!firebaseConfig.apiKey) {
    console.warn("Firebase not configured. Please set up .env.local");
    return () => {}; // Return empty unsubscribe function
  }

  const q = query(collection(db, FUEL_LOGS_COLLECTION), orderBy('date', 'desc'));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const logs: FuelLog[] = [];
    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() } as FuelLog);
    });
    callback(logs);
  }, (error) => {
    console.error("Error subscribing to Firebase: ", error);
  });

  return unsubscribe;
}

// --------------------------------------------------------
// FIREBASE AUTHENTICATION (OWNER MODE)
// --------------------------------------------------------

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  if (!auth?.app) {
    throw new Error('Firebase Auth not initialized. Check .env.local keys.');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  if (!auth?.app) {
    throw new Error('Firebase Auth not initialized. Check .env.local keys.');
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    // Map Firebase error codes to readable messages
    const code = error.code || '';
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      throw new Error('Incorrect email or password.');
    } else if (code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Try again in a few minutes.');
    } else if (code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    }
    throw new Error(error.message || 'Email sign-in failed.');
  }
}

export async function signOutGoogle(): Promise<void> {
  if (!auth?.app) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  if (!auth?.app) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
