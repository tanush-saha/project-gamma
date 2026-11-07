import { useState, useEffect, createContext, useContext } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase-config.jsx";

const AuthContext = createContext(null);

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      if (user) {
        // Fetch user profile from Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          preferredStream: userSnap.data()?.preferredStream || "",
          theme: userSnap.data()?.theme || "light",
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Create initial profile
    await setDoc(doc(db, "users", result.user.uid), {
      displayName: email.split("@")[0],
      email: result.user.email,
      preferredStream: "",
      theme: "light",
      createdAt: new Date(),
    });
    setUser({
      uid: result.user.uid,
      email: result.user.email,
      displayName: email.split("@")[0],
      photoURL: result.user.photoURL,
      preferredStream: "",
      theme: "light",
    });
  };

  const signInWithEmailLogin = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, "users", result.user.uid);
    const userSnap = await getDoc(userRef);
    setUser({
      uid: result.user.uid,
      email: result.user.email,
      displayName: userSnap.data()?.displayName || result.user.email,
      photoURL: result.user.photoURL,
      preferredStream: userSnap.data()?.preferredStream || "",
      theme: userSnap.data()?.theme || "light",
    });
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await setDoc(doc(db, "users", result.user.uid), {
      displayName: result.user.displayName,
      email: result.user.email,
      preferredStream: "",
      theme: "light",
      createdAt: new Date(),
    });
    setUser({
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      preferredStream: "",
      theme: "light",
    });
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
  };

  const value = {
    user,
    loading,
    signInWithEmail,
    signInWithEmailLogin,
    signInWithGoogle,
    handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}

export default useAuth;