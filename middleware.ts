import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "./lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = await createMiddlewareClient(request)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If the user is not signed in and the current path is not /login or /register, redirect to /login
  if (!session && !["/login", "/register", "/"].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the user is signed in and the current path is /login or /register, redirect to /dashboard
  if (session && ["/login", "/register"].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Handle the forgot-password route
  if (request.nextUrl.pathname.includes("/forgot-password")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return response
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
