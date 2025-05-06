import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { LoginForm } from "@/components/auth/login-form"

export default async function Login() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-m8bs-bg to-m8bs-card-alt">
      <div className="w-full max-w-md px-4">
        <LoginForm />
      </div>
    </div>
  )
}
