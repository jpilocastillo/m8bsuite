import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchAnalyticsData } from "@/lib/data"

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Verify the user exists
    const supabase = await createAdminClient()
    const { data: user, error: userError } = await supabase.from("profiles").select("id").eq("id", userId).single()

    if (userError || !user) {
      console.error("Error verifying user:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch analytics data
    const analyticsData = await fetchAnalyticsData(userId)

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("Error in analytics API route:", error)
    return NextResponse.json({ error: "An error occurred while fetching analytics data" }, { status: 500 })
  }
}
