"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { LoadingScreen } from "@/components/loading-screen"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          // Clear any invalid session state
          setSession(null)
          setUser(null)
          setIsLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      } catch (error) {
        console.error("Exception getting session:", error)
        setSession(null)
        setUser(null)
        setIsLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Error signing out:", error)
      // Force a hard refresh to clear any client-side state
      window.location.href = "/login"
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{isLoading ? <LoadingScreen /> : children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
