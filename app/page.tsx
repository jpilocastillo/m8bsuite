import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LoginForm } from "@/components/login-form"

export default async function Home() {
  // Create the Supabase client
  const supabase = await createClient()

  try {
    // Get the session
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Error checking session:", error)
      // If there's an error, just render the login form
      return <LoginForm />
    }

    // If user is authenticated, redirect to dashboard
    if (data.session) {
      // Important: redirect must be outside of try/catch
      // and at the top level of the component
      redirect("/dashboard")
    }
  } catch (error) {
    console.error("Error in session check:", error)
    // In case of any error, show the login form
    return <LoginForm />
  }

  // If not authenticated, render the login form directly
  return <LoginForm />
}
