import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { RegisterForm } from "@/components/auth/register-form"

export default async function Register() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-m8bs-bg to-m8bs-card-alt p-4">
      <div className="w-full max-w-xl">
        <RegisterForm />
      </div>
    </div>
  )
}
