import type React from "react"
import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { fetchUserEvents } from "@/lib/data"
import { AnimatedBackground } from "@/components/dashboard/animated-background"
import { SupabaseInitCheck } from "@/components/supabase-init-check"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

// Simple in-memory cache with expiration
const AUTH_CACHE = new Map<string, { data: any; expires: number }>()
const CACHE_TTL = 60 * 1000 // 1 minute cache

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("sb-auth-token")
    const sessionKey = sessionCookie?.value || "no-session"

    // Check cache first
    const cachedAuth = AUTH_CACHE.get(sessionKey)
    let user = null
    let events = []

    if (cachedAuth && cachedAuth.expires > Date.now()) {
      // Use cached user data
      user = cachedAuth.data.user
      events = cachedAuth.data.events
    } else {
      // No valid cache, fetch from Supabase
      try {
        const supabase = await createClient()

        // Add delay between requests to avoid rate limiting
        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

        try {
          const {
            data: { user: userData },
            error: userError,
          } = await supabase.auth.getUser()

          if (userError) {
            // Check if it's a rate limit error
            if (userError.message && userError.message.includes("Too Many Requests")) {
              console.warn("Rate limit hit, waiting before retry...")
              await delay(1000) // Wait 1 second before retry

              // Retry once
              const retryResponse = await supabase.auth.getUser()
              if (retryResponse.error) {
                console.error("Auth retry error:", retryResponse.error)
                redirect("/login?error=rate_limit")
              }
              user = retryResponse.data.user
            } else {
              console.error("Auth error:", userError)
              redirect("/login")
            }
          }

          if (!userData && !user) {
            redirect("/login")
          }

          if (userData) {
            user = userData
          }

          // Fetch all events for the user to pass to the header
          if (user) {
            try {
              events = await fetchUserEvents(user.id)

              // Cache the successful result
              AUTH_CACHE.set(sessionKey, {
                data: { user, events },
                expires: Date.now() + CACHE_TTL,
              })
            } catch (eventsError) {
              console.error("Error fetching events:", eventsError)
              // Continue with empty events array
            }
          }
        } catch (authError) {
          console.error("Unexpected auth error:", authError)

          // Check if it's a parsing error from rate limiting
          if (authError instanceof SyntaxError && authError.message.includes("Unexpected token")) {
            redirect("/login?error=rate_limit")
          }

          redirect("/login")
        }
      } catch (clientError) {
        console.error("Error creating Supabase client:", clientError)
        redirect("/login?error=client_init")
      }
    }

    return (
      <div className="flex h-screen bg-m8bs-bg text-white overflow-hidden">
        <AnimatedBackground />
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <DashboardHeader events={events} />
          <main className="flex-1 overflow-y-auto p-6 bg-m8bs-bg bg-gradient-radial from-m8bs-card-alt/10 to-m8bs-bg">
            {/* Add Supabase initialization check */}
            <SupabaseInitCheck />
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          </main>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Critical error in dashboard layout:", error)
    // In case of a critical error, redirect to login
    redirect("/login?error=critical")
  }
}
