"use client"

import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Login page error:", error)
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
    <div className="fixed inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-m8bs-bg to-m8bs-card-alt">
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Login Error</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          We encountered an issue while loading the login page. Please try again.
        </p>
        <div className="space-y-4">
          <Button className="w-full" onClick={handleReset}>
            Try again
          </Button>
          <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>
            Return to Home
          </Button>
        </div>
        {error.digest && <p className="mt-4 text-xs text-gray-500 text-center">Error ID: {error.digest}</p>}
      </div>
    </div>
  )
}
