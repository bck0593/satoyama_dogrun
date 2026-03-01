"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { safeLocalStorage } from "@/app/lib/browser"

type User = {
  id: string
  name: string
  email: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = safeLocalStorage.getItem("fc-imabari-user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Failed to parse stored user:", error)
        safeLocalStorage.removeItem("fc-imabari-user")
      }
    }
    setIsLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Mock sign in - in real app this would call an API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockUser: User = {
        id: "1",
        name: email.split("@")[0],
        email,
      }

      setUser(mockUser)
      safeLocalStorage.setItem("fc-imabari-user", JSON.stringify(mockUser))
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
    safeLocalStorage.removeItem("fc-imabari-user")
  }

  return <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
