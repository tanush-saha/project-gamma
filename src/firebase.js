const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(config).every(Boolean);

let firebasePromise;

export function loadFirebase() {
  if (!firebaseConfigured) {
    return Promise.reject(new Error("Firebase is not configured."));
  }

  if (!firebasePromise) {
    firebasePromise = Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore"),
    ]).then(([appSdk, authSdk, firestoreSdk]) => {
      const app = appSdk.getApps()[0] || appSdk.initializeApp(config);
      return {
        auth: authSdk.getAuth(app),
        db: firestoreSdk.getFirestore(app),
        ...authSdk,
        ...firestoreSdk,
      };
    });
  }

  return firebasePromise;
}
