const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredConfig = [
  ["VITE_FIREBASE_API_KEY", config.apiKey],
  ["VITE_FIREBASE_AUTH_DOMAIN", config.authDomain],
  ["VITE_FIREBASE_PROJECT_ID", config.projectId],
  ["VITE_FIREBASE_APP_ID", config.appId],
];
const isConfiguredValue = (value) => typeof value === "string"
  && value.trim().length > 0
  && !/^(your-|replace-|<|example)/i.test(value.trim());
export const missingFirebaseConfig = requiredConfig
  .filter(([, value]) => !isConfiguredValue(value))
  .map(([name]) => name);
export const firebaseConfigured = missingFirebaseConfig.length === 0;

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
    ]).then(async ([appSdk, authSdk, firestoreSdk]) => {
      const appOptions = Object.fromEntries(Object.entries(config).filter(([, value]) => isConfiguredValue(value)));
      const app = appSdk.getApps()[0] || appSdk.initializeApp(appOptions);
      const services = {
        auth: authSdk.getAuth(app),
        db: firestoreSdk.getFirestore(app),
        ...authSdk,
        ...firestoreSdk,
        storage: null,
      };

      if (isConfiguredValue(config.storageBucket)) {
        const storageSdk = await import("firebase/storage");
        services.storage = storageSdk.getStorage(app, `gs://${config.storageBucket}`);
        Object.assign(services, storageSdk);
      }

      if (isConfiguredValue(config.measurementId)) {
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
