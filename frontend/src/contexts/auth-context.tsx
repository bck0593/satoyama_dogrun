"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { apiClient } from "@/src/lib/api";
import { tokenStorage } from "@/src/lib/auth";
import type { UserProfile } from "@/src/lib/types";

type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  loginWithLineMock: (input: { lineUserId: string; displayName: string; email?: string }) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      setUser(null);
      return;
    }

    const profile = await apiClient.getMe();
    setUser(profile);
  }, []);

  useEffect(() => {
    refreshProfile()
      .catch(() => {
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [refreshProfile]);

  const loginWithLineMock = useCallback(
    async (input: { lineUserId: string; displayName: string; email?: string }) => {
      const result = await apiClient.lineLogin({
        line_user_id: input.lineUserId,
        display_name: input.displayName,
        email: input.email,
      });
      tokenStorage.setTokens(result.access, result.refresh);
      setUser(result.user);
      return result.is_new_user;
    },
    [],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      loginWithLineMock,
      refreshProfile,
      logout,
    }),
    [user, loading, loginWithLineMock, refreshProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
