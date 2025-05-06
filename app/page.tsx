export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/login-form";

export default async function Home() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error checking session:", error);
      return <LoginForm />;
    }

    if (data.session) {
      redirect("/dashboard");
    }
  } catch (error) {
    console.error("Error in session check:", error);
    return <LoginForm />;
  }

  return <LoginForm />;
}
