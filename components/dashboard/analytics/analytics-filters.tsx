"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { FilterX, SlidersHorizontal } from "lucide-react"

interface AnalyticsFiltersProps {
  analyticsData: any
  onFilterChange: (filteredData: any) => void
}

export function AnalyticsFilters({ analyticsData, onFilterChange }: AnalyticsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [eventType, setEventType] = useState<string>("all")
  const [dateRange, setDateRange] = useState<[number, number]>([0, 100])
  const [minAttendees, setMinAttendees] = useState(0)
  const [showProfitableOnly, setShowProfitableOnly] = useState(false)

  // Track if we've already applied filters to prevent infinite loops
  const [filtersApplied, setFiltersApplied] = useState(false)

  // Get unique event types
  const eventTypes = analyticsData?.metricsByType?.map((metric: any) => metric.type) || []

  // Get min/max dates for the slider
  const events = analyticsData?.events || []
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const oldestEvent = sortedEvents[0]?.date ? new Date(sortedEvents[0].date).getTime() : Date.now()
  const newestEvent = sortedEvents[sortedEvents.length - 1]?.date
    ? new Date(sortedEvents[sortedEvents.length - 1].date).getTime()
    : Date.now()

  // Apply filters when they change
  const applyFilters = useCallback(() => {
    if (!analyticsData || filtersApplied) return

    setFiltersApplied(true)

    try {
      let filteredEvents = [...(analyticsData.events || [])]

      // Filter by event type
      if (eventType !== "all") {
        filteredEvents = filteredEvents.filter((event) => event.type === eventType)
      }

      // Filter by date range
      if (dateRange[0] !== 0 || dateRange[1] !== 100) {
        const minDate = oldestEvent + (dateRange[0] / 100) * (newestEvent - oldestEvent)
        const maxDate = oldestEvent + (dateRange[1] / 100) * (newestEvent - oldestEvent)

        filteredEvents = filteredEvents.filter((event) => {
          const eventDate = new Date(event.date).getTime()
          return eventDate >= minDate && eventDate <= maxDate
        })
      }

      // Filter by minimum attendees
      if (minAttendees > 0) {
        filteredEvents = filteredEvents.filter((event) => event.attendees >= minAttendees)
      }

      // Filter by profitability
      if (showProfitableOnly) {
        filteredEvents = filteredEvents.filter((event) => event.profit > 0)
      }

      // Recalculate summary metrics
      const totalEvents = filteredEvents.length
      const totalAttendees = filteredEvents.reduce((sum, event) => sum + event.attendees, 0)
      const totalClients = filteredEvents.reduce((sum, event) => sum + event.clients, 0)
      const totalRevenue = filteredEvents.reduce((sum, event) => sum + event.revenue, 0)
      const totalExpenses = filteredEvents.reduce((sum, event) => sum + event.expenses, 0)
      const totalProfit = totalRevenue - totalExpenses

      const avgAttendees = totalEvents > 0 ? totalAttendees / totalEvents : 0
      const avgClients = totalEvents > 0 ? totalClients / totalEvents : 0

      const overallConversionRate = totalAttendees > 0 ? (totalClients / totalAttendees) * 100 : 0
      const overallROI = totalExpenses > 0 ? (totalProfit / totalExpenses) * 100 : 0

      // Create filtered data object
      const filteredData = {
        ...analyticsData,
        events: filteredEvents,
        summary: {
          ...analyticsData.summary,
          totalEvents,
          totalAttendees,
          totalClients,
          totalRevenue,
          totalExpenses,
          totalProfit,
          avgAttendees,
          avgClients,
          overallConversionRate,
          overallROI,
        },
      }

      onFilterChange(filteredData)
    } catch (error) {
      console.error("Error applying filters:", error)
    } finally {
      setFiltersApplied(false)
    }
  }, [
    analyticsData,
    eventType,
    dateRange,
    minAttendees,
    showProfitableOnly,
    oldestEvent,
    newestEvent,
    onFilterChange,
    filtersApplied,
  ])

  // Apply filters when filter values change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Reset filters
  const resetFilters = () => {
    setEventType("all")
    setDateRange([0, 100])
    setMinAttendees(0)
    setShowProfitableOnly(false)
    onFilterChange(analyticsData)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-white border-m8bs-border"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {isOpen ? "Hide Filters" : "Show Filters"}
        </Button>

        {isOpen && (
          <Button variant="outline" size="sm" onClick={resetFilters} className="text-white border-m8bs-border">
            <FilterX className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="bg-m8bs-card-alt border-m8bs-border">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Event Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="event-type" className="text-white">
                  Event Type
                </Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger id="event-type" className="bg-m8bs-card border-m8bs-border text-white">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent className="bg-m8bs-card border-m8bs-border text-white">
                    <SelectItem value="all">All Types</SelectItem>
                    {eventTypes.map((type: string) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label className="text-white">Date Range</Label>
                <Slider
                  value={dateRange}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => setDateRange(value as [number, number])}
                  className="mt-6"
                />
              </div>

              {/* Minimum Attendees Filter */}
              <div className="space-y-2">
                <Label htmlFor="min-attendees" className="text-white">
                  Minimum Attendees
                </Label>
                <Select
                  value={minAttendees.toString()}
                  onValueChange={(value) => setMinAttendees(Number.parseInt(value))}
                >
                  <SelectTrigger id="min-attendees" className="bg-m8bs-card border-m8bs-border text-white">
                    <SelectValue placeholder="Min attendees" />
                  </SelectTrigger>
                  <SelectContent className="bg-m8bs-card border-m8bs-border text-white">
                    <SelectItem value="0">No minimum</SelectItem>
                    <SelectItem value="10">10+ attendees</SelectItem>
                    <SelectItem value="20">20+ attendees</SelectItem>
                    <SelectItem value="30">30+ attendees</SelectItem>
                    <SelectItem value="50">50+ attendees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Profitable Only Filter */}
              <div className="flex items-center space-x-2 pt-8">
                <Switch id="profitable-only" checked={showProfitableOnly} onCheckedChange={setShowProfitableOnly} />
                <Label htmlFor="profitable-only" className="text-white">
                  Profitable Events Only
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
