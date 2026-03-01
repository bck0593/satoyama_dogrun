"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/src/contexts/auth-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading) {
    return <div className="px-4 py-8 text-sm text-gray-600">読み込み中...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
