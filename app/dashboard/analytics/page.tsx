import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AnalyticsDashboard } from "@/components/dashboard/analytics/analytics-dashboard"
import { DashboardError } from "@/components/dashboard/dashboard-error"
import { fetchAnalyticsData } from "@/lib/data"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error("Error in AnalyticsPage:", error)
      redirect("/login")
    }

    if (!data.user) {
      console.log("No user found, redirecting to login")
      redirect("/login")
    }

    // Fetch analytics data with error handling
    try {
      const analyticsData = await fetchAnalyticsData(data.user.id)
      return <AnalyticsDashboard analyticsData={analyticsData} />
    } catch (dataError) {
      console.error("Error fetching analytics data:", dataError)
      return <DashboardError error="An error occurred loading the analytics data. Please try again later." />
    }
  } catch (error) {
    console.error("Unhandled error in AnalyticsPage:", error)

    // If this is a redirect, let Next.js handle it
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error
    }

    return <DashboardError error="An error occurred loading the analytics. Please try again later." />
  }
}
