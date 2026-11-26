import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  onSnapshot,
  type DocumentData,
  type Query,
  type Unsubscribe,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === "string" && value.length > 0,
);

const firebaseApp = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const firestore = firebaseApp ? getFirestore(firebaseApp) : null;

export function requireFirestore() {
  if (!firestore) {
    throw new Error(
      "Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* settings and restart the app.",
    );
  }
  return firestore;
}

/** Subscribes to a Firestore collection/query, parsing each doc and normalizing errors. */
export function watchCollection<T>(
  target: Query<DocumentData>,
  parse: (id: string, data: DocumentData) => T,
  onItems: (items: T[]) => void,
  onError: (error: Error) => void,
  fallbackError: string,
  transform?: (items: T[]) => T[],
): Unsubscribe {
  return onSnapshot(
    target,
    (snapshot) => {
      try {
        const parsed = snapshot.docs.map((item) => parse(item.id, item.data()));
        onItems(transform ? transform(parsed) : parsed);
      } catch (error) {
        onError(error instanceof Error ? error : new Error(fallbackError));
      }
    },
    onError,
  );
}
