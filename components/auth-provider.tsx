"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type User = any | null

type AuthContextType = {
  user: User
  signOut: () => Promise<void>
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signOut: async () => {},
  isLoading: true,
  error: null,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    try {
      const getUser = async () => {
        try {
          setIsLoading(true)

          const {
            data: { user: authUser },
            error: authError,
          } = await supabase.auth.getUser()

          if (authError) {
            console.error("Error getting user:", authError)
            setError(authError.message)
            setUser(null)
          } else {
            setUser(authUser)
            setError(null)
          }
        } catch (error) {
          console.error("Unexpected error in getUser:", error)
          setError("An unexpected error occurred while getting user data")
          setUser(null)
        } finally {
          setIsLoading(false)
        }
      }

      // Call getUser immediately
      getUser()

      // Set up auth state change listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          if (event === "SIGNED_IN" && session) {
            setUser(session.user)
            router.refresh()
          } else if (event === "SIGNED_OUT") {
            setUser(null)
            router.refresh()
          }
        } catch (error) {
          console.error("Error in auth state change:", error)
          setError("An error occurred during authentication state change")
        }
      })

      // Cleanup function
      return () => {
        if (subscription) {
          subscription.unsubscribe()
        }
      }
    } catch (error) {
      console.error("Fatal error in AuthProvider:", error)
      setError("A critical error occurred in the authentication system")
      setIsLoading(false)
    }
  }, [supabase, router])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      setError("An error occurred while signing out")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signOut,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
