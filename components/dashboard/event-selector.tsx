"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface EventSelectorProps {
  events: any[]
  selectedEventId?: string | null
  onSelect: (eventId: string) => void
  isLoading?: boolean
}

export interface Event {
  id: string
  date: string
  name: string
  location: string
  type: string
  topic?: string
  budget: number
}

export function EventSelector({ events, selectedEventId, onSelect, isLoading = false }: EventSelectorProps) {
  const [value, setValue] = useState<string>(selectedEventId || "")

  // Update the value when selectedEventId changes
  useEffect(() => {
    if (selectedEventId && selectedEventId !== value) {
      setValue(selectedEventId)
    } else if (!selectedEventId && events.length > 0 && !value) {
      // Set default value if no event is selected
      setValue(events[0].id)
    }
  }, [selectedEventId, events, value])

  const handleValueChange = (newValue: string) => {
    setValue(newValue)
    onSelect(newValue)
  }

  if (events.length === 0) {
    return <div className="text-sm text-white/70">No events available</div>
  }

  return (
    <div className="flex items-center gap-2">
      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-white/70" />}
      <Select value={value} onValueChange={handleValueChange} disabled={isLoading}>
        <SelectTrigger className="w-[250px] bg-m8bs-card border-m8bs-border text-white">
          <SelectValue placeholder="Select an event" />
        </SelectTrigger>
        <SelectContent className="bg-m8bs-card border-m8bs-border text-white">
          {events.map((event) => (
            <SelectItem key={event.id} value={event.id}>
              {event.name || "Unnamed Event"} ({new Date(event.date).toLocaleDateString()})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
