"use client"

import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="bg-gradient-to-b from-m8bs-card to-m8bs-card-alt border border-m8bs-border rounded-lg shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-4">Dashboard Error</h2>
        <p className="text-m8bs-muted mb-6">
          There was a problem loading the dashboard. This might be due to a temporary connection issue or a problem with
          your account.
        </p>
        <div className="space-y-4">
          <Button className="w-full btn-blue-gradient" onClick={() => reset()}>
            Retry Dashboard
          </Button>
          <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>
            Return to Home
          </Button>
        </div>
        {error.digest && <p className="mt-4 text-xs text-m8bs-muted text-center">Error ID: {error.digest}</p>}
      </div>
    </div>
  )
}
