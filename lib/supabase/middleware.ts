import { createServerClient } from "@supabase/ssr"
import type { NextRequest, NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

export async function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  try {
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
            return request.cookies.get(name)?.value
          },
          set(name, value, options) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name, options) {
            request.cookies.set({
              name,
              value: "",
              ...options,
            })
            response.cookies.set({
              name,
              value: "",
              ...options,
            })
          },
        },
        // Add global error handler for rate limiting
        global: {
          fetch: async (url, options) => {
            try {
              const response = await fetch(url, options)

              // Handle rate limiting
              if (response.status === 429) {
                console.warn("Rate limit hit on Supabase middleware request")
                // Wait and retry once
                await new Promise((resolve) => setTimeout(resolve, 1000))
                return fetch(url, options)
              }

              return response
            } catch (error) {
              console.error("Fetch error in Supabase middleware client:", error)
              throw error
            }
          },
        },
      },
    )

    return supabase
  } catch (error) {
    console.error("Error creating Supabase middleware client:", error)
    throw error
  }
}
