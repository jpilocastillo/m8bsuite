import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@/lib/supabase/middleware"

// Simple rate limiting for middleware
const REQUESTS = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 30 // 30 requests per minute

export async function middleware(request: NextRequest) {
  // Create a response object
  const response = NextResponse.next()

  try {
    // Basic rate limiting by IP
    const ip = request.ip || "unknown"
    const now = Date.now()
    const requestData = REQUESTS.get(ip) || { count: 0, timestamp: now }

    // Reset counter if window has passed
    if (now - requestData.timestamp > RATE_LIMIT_WINDOW) {
      requestData.count = 0
      requestData.timestamp = now
    }

    // Increment counter
    requestData.count++
    REQUESTS.set(ip, requestData)

    // Check if rate limited
    if (requestData.count > RATE_LIMIT_MAX) {
      console.warn(`Rate limit exceeded for IP: ${ip}`)
      return new NextResponse("Too Many Requests", { status: 429 })
    }

    // Create the Supabase middleware client
    const supabase = await createMiddlewareClient(request, response)

    // Get the session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const url = new URL(request.url)
    const path = url.pathname

    // If the user is not signed in and the current path is not /login or /register, redirect to /login
    if (!session && !["/login", "/register", "/"].includes(path)) {
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    // If the user is signed in and the current path is /login or /register, redirect to /dashboard
    if (session && ["/login", "/register", "/"].includes(path)) {
      const dashboardUrl = new URL("/dashboard", request.url)
      return NextResponse.redirect(dashboardUrl)
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of error, allow the request to continue
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
