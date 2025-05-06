"use client"

import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  // Handle the case where reset might not be a function
  const handleReset = () => {
    if (typeof reset === "function") {
      reset()
    } else {
      // Fallback: reload the page
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-m8bs-card-alt border border-m8bs-border rounded-lg shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
        <p className="text-m8bs-muted mb-6">
          The application encountered an unexpected error. Our team has been notified.
        </p>
        <div className="space-y-4">
          <Button className="w-full btn-blue-gradient" onClick={handleReset}>
            Try again
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
