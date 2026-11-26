"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginScreen, type LoginValues } from "@/components/login/login-screen";

export function LoginClient() {
  const router = useRouter();
  const { signIn: authenticate } = useAuth();

  async function signIn({ email, password }: LoginValues) {
    await authenticate(email, password);
  }

  return <LoginScreen onSubmit={signIn} onSuccess={() => router.replace("/")} />;
}
