const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const firebaseConfigured = [
  config.apiKey,
  config.authDomain,
  config.projectId,
  config.storageBucket,
  config.messagingSenderId,
  config.appId,
].every(Boolean);

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
      import("firebase/storage"),
    ]).then(([appSdk, authSdk, firestoreSdk, storageSdk]) => {
      const app = appSdk.getApps()[0] || appSdk.initializeApp(config);
      const services = {
        auth: authSdk.getAuth(app),
        db: firestoreSdk.getFirestore(app),
        storage: storageSdk.getStorage(app),
        ...authSdk,
        ...firestoreSdk,
        ...storageSdk,
      };

      if (config.measurementId) {
        services.analytics = import("firebase/analytics")
          .then(async (analyticsSdk) => {
            if (!await analyticsSdk.isSupported()) return null;
            return analyticsSdk.getAnalytics(app);
          })
          .catch((error) => {
            console.error("Firebase Analytics could not be initialized:", error);
            return null;
          });
      }

      return services;
    }).catch((error) => {
      firebasePromise = undefined;
      throw error;
    });
  }

  return firebasePromise;
}
