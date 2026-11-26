"use client";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { doc, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore, isFirebaseConfigured } from "@/lib/firebase";

type AuthStatus = "loading" | "signed-in" | "signed-out" | "not-configured";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    isFirebaseConfigured ? "loading" : "not-configured",
  );

  useEffect(() => {
    if (!firebaseAuth) return;
    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setStatus(nextUser ? "signed-in" : "signed-out");
      if (nextUser && firestore) {
        void setDoc(
          doc(firestore, "users", nextUser.uid),
          {
            uid: nextUser.uid,
            email: nextUser.email ?? null,
            displayName: nextUser.displayName ?? null,
            photoURL: nextUser.photoURL ?? null,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        ).catch(() => {
          // Ignore profile sync errors so sign-in state is never blocked.
        });
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      signIn: async (email, password) => {
        if (!firebaseAuth) {
          throw new Error(
            "Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* settings and restart the app.",
          );
        }
        try {
          await signInWithEmailAndPassword(firebaseAuth, email, password);
        } catch (error) {
          const code =
            typeof error === "object" && error !== null && "code" in error
              ? error.code
              : "";
          if (
            code === "auth/invalid-credential" ||
            code === "auth/user-not-found" ||
            code === "auth/wrong-password"
          ) {
            throw new Error("That email and password don't match.");
          }
          throw error;
        }
      },
      signOutUser: async () => {
        if (!firebaseAuth) {
          throw new Error("Firebase is not configured.");
        }
        await signOut(firebaseAuth);
      },
    }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
