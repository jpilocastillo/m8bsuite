import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"

export async function createMiddlewareClient(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables")
  }

  const cookieStore = cookies()

  try {
    return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.error("Error setting cookie in middleware:", error)
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch (error) {
            console.error("Error removing cookie in middleware:", error)
          }
        },
      },
    })
  } catch (error) {
    console.error("Error creating middleware client:", error)
    throw error
  }
}
