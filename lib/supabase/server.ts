import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// Cache for Supabase clients to avoid creating too many
const CLIENT_CACHE = new Map<string, any>()
const CLIENT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function createClient() {
  try {
    const cookieStore = cookies()
    const cacheKey = Array.from(cookieStore.getAll())
      .map((c) => `${c.name}=${c.value}`)
      .join(";")

    // Check if we have a cached client
    const cachedClient = CLIENT_CACHE.get(cacheKey)
    if (cachedClient && cachedClient.expires > Date.now()) {
      return cachedClient.client
    }

    // Check if the required environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("NEXT_PUBLIC_SUPABASE_URL is missing")
      throw new Error("Supabase URL is not configured")
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing")
      throw new Error("Supabase anonymous key is not configured")
    }

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
        // Add global error handler for rate limiting
        global: {
          fetch: async (url, options) => {
            try {
              const response = await fetch(url, options)

              // Handle rate limiting
              if (response.status === 429) {
                console.warn("Rate limit hit on Supabase request")
                // Wait and retry once
                await new Promise((resolve) => setTimeout(resolve, 1000))
                return fetch(url, options)
              }

              return response
            } catch (error) {
              console.error("Fetch error in Supabase client:", error)
              throw error
            }
          },
        },
      },
    )

    // Cache the client
    CLIENT_CACHE.set(cacheKey, {
      client: supabase,
      expires: Date.now() + CLIENT_CACHE_TTL,
    })

    return supabase
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    // Return a mock client that won't crash the application
    return createMockClient()
  }
}

// Create a mock client that returns empty data
function createMockClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
        }),
        maybeSingle: async () => ({ data: null, error: null }),
      }),
    }),
  } as any
}
