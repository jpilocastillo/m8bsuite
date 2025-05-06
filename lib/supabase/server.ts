import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"
import { cache } from "react"

export const createClient = cache(() => {
  const cookieStore = cookies()

  // Ensure the environment variables are defined
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables in server")
    // Return a mock client to prevent runtime errors
    return {
      from: () => ({
        select: () => ({
          limit: () => ({
            then: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
          }),
          single: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
          maybeSingle: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
    } as any
  }

  try {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting errors silently in production
            console.error("Error setting cookie:", error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch (error) {
            // Handle cookie removal errors silently in production
            console.error("Error removing cookie:", error)
          }
        },
      },
    })

    return supabase
  } catch (error) {
    console.error("Error creating Supabase server client:", error)
    throw error
  }
})
