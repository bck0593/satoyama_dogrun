"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/src/contexts/auth-context";

export function AuthGuard({
  children,
  requireStaff = false,
}: {
  children: React.ReactNode;
  requireStaff?: boolean;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    if (!loading && requireStaff && user && !user.is_staff) {
      router.replace("/");
    }
  }, [loading, requireStaff, router, user]);

  if (loading) {
    return <div className="px-4 py-8 text-sm text-gray-600">読み込み中...</div>;
  }

  if (!user) {
    return null;
  }

  if (requireStaff && !user.is_staff) {
    return <div className="px-4 py-8 text-sm text-gray-600">管理者権限を確認しています...</div>;
  }

  return <>{children}</>;
}
