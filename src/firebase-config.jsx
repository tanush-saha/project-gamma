import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";

// Your web app's Firebase configuration
// These values should be replaced with your actual Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export typed helpers
export { onAuthStateChanged };

// Google provider
export const googleProvider = new GoogleAuthProvider();

// Sign up with email
export const doCreateUserWithEmailAndPassword = createUserWithEmailAndPassword;

// Sign in with email
export const doSignInWithEmailAndPassword = signInWithEmailAndPassword;

// Sign out
export const doSignOut = signOut;