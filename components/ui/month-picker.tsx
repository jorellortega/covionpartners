"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface MonthPickerProps {
  value?: string // Format: YYYY-MM
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
]

export function MonthPicker({
  value,
  onValueChange,
  placeholder = "Pick a month",
  className,
  disabled = false
}: MonthPickerProps) {
  // Parse YYYY-MM format
  const [year, month] = value ? value.split('-') : [null, null]
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)

  const handleMonthChange = (newMonth: string) => {
    if (year) {
      onValueChange?.(`${year}-${newMonth}`)
    } else {
      onValueChange?.(`${currentYear}-${newMonth}`)
    }
  }

  const handleYearChange = (newYear: string) => {
    if (month) {
      onValueChange?.(`${newYear}-${month}`)
    } else {
      onValueChange?.(`${newYear}-01`)
    }
  }

  const displayValue = value && year && month
    ? format(new Date(parseInt(year), parseInt(month) - 1, 1), "MMMM yyyy")
    : placeholder

  return (
    <div className={cn("flex gap-2", className)}>
      <Select
        value={month || undefined}
        onValueChange={handleMonthChange}
        disabled={disabled}
      >
        <SelectTrigger className="flex-1 bg-gray-900 border-gray-700 text-white">
          <SelectValue placeholder="Month">
            {month ? MONTHS.find(m => m.value === month)?.label : "Month"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={m.value} className="text-white">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={year || undefined}
        onValueChange={handleYearChange}
        disabled={disabled}
      >
        <SelectTrigger className="flex-1 bg-gray-900 border-gray-700 text-white">
          <SelectValue placeholder="Year">
            {year || "Year"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          {years.map((y) => (
            <SelectItem key={y} value={String(y)} className="text-white">
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

