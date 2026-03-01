"use client";

import { AuthProvider } from "@/src/contexts/auth-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
