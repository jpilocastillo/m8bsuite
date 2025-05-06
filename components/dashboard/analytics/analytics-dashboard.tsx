"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { AnalyticsFilters } from "@/components/dashboard/analytics/analytics-filters"
import { AnalyticsSummary } from "@/components/dashboard/analytics/analytics-summary"
import { TopPerformers } from "@/components/dashboard/analytics/top-performers"
import { PerformanceHeatmap } from "@/components/dashboard/analytics/performance-heatmap"
import { EventComparison } from "@/components/dashboard/analytics/event-comparison"
import { EnhancedExport } from "@/components/dashboard/analytics/enhanced-export"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardError } from "@/components/dashboard/dashboard-error"

// Sample data structure with defaults
const defaultData = {
  summary: {
    totalEvents: 0,
    totalAttendees: 0,
    avgAttendees: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    overallROI: 0,
    totalClients: 0,
    overallConversionRate: 0,
    appointmentConversionRate: 0,
    avgAppointments: 0,
    avgClients: 0,
  },
  events: [],
  monthlyData: [],
  metricsByType: [],
}

interface AnalyticsDashboardProps {
  analyticsData: any
  userId?: string
}

export function AnalyticsDashboard({ analyticsData, userId }: AnalyticsDashboardProps) {
  // Use useRef to track if we've already fetched data
  const dataFetchedRef = useRef(false)

  // Initialize state with the provided data or defaults
  const [filteredData, setFilteredData] = useState(() => analyticsData || defaultData)
  const [activeMetric, setActiveMetric] = useState<"ROI" | "Conversion" | "Revenue" | "Attendees" | "Clients">("ROI")
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // If userId is provided but no analyticsData, fetch it client-side
  useEffect(() => {
    async function fetchData() {
      // Only fetch if we haven't already and we need to (userId exists but no data)
      if (userId && !analyticsData && !dataFetchedRef.current) {
        dataFetchedRef.current = true // Mark that we've started fetching
        setLoading(true)
        try {
          const response = await fetch(`/api/analytics?userId=${userId}`)
          if (!response.ok) {
            throw new Error(`Error fetching analytics data: ${response.statusText}`)
          }
          const data = await response.json()
          setFilteredData(data)
        } catch (err) {
          console.error("Error fetching analytics data:", err)
          setError("Failed to load analytics data. Please try again later.")
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [userId, analyticsData]) // Remove filteredData from dependencies

  // Handle filter changes with useCallback to prevent recreation on every render
  const handleFilterChange = useCallback((newFilteredData: any) => {
    setFilteredData(newFilteredData)
  }, [])

  if (error) {
    return <DashboardError error={error} />
  }

  if (loading) {
    return <div className="p-8 text-center">Loading analytics data...</div>
  }

  // Ensure we have valid data
  const safeData = filteredData || defaultData

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Multi-Event Analytics Dashboard</h1>
        <EnhancedExport data={safeData} />
      </div>

      <div className="bg-gradient-to-r from-m8bs-card to-m8bs-card-alt border border-m8bs-border rounded-lg p-4 shadow-md">
        <AnalyticsFilters analyticsData={safeData} onFilterChange={handleFilterChange} />
      </div>

      <AnalyticsSummary data={safeData.summary} />

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 bg-[#131525] border border-[#1f2037]">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
            Overview
          </TabsTrigger>
          <TabsTrigger value="comparison" className="data-[state=active]:bg-blue-600">
            Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-m8bs-card to-m8bs-card-alt border-m8bs-border rounded-lg p-6 shadow-md card-hover">
              <TopPerformers
                data={safeData.events || []}
                activeMetric={activeMetric}
                onMetricChange={setActiveMetric}
              />
            </div>
            <div className="bg-gradient-to-br from-m8bs-card to-m8bs-card-alt border-m8bs-border rounded-lg p-6 shadow-md card-hover">
              <PerformanceHeatmap data={safeData} activeMetric={activeMetric} onMetricChange={setActiveMetric} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="mt-4">
          <div className="grid grid-cols-1 gap-6">
            <EventComparison events={safeData.events || []} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
