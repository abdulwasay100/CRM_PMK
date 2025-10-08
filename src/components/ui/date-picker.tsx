import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState<Date>(value || new Date())

  // Generate year options (from 1900 to current year)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i)
  
  // Generate month options
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentMonth)
    newDate.setFullYear(parseInt(year))
    setCurrentMonth(newDate)
  }

  const handleMonthChange = (month: string) => {
    const monthIndex = months.indexOf(month)
    const newDate = new Date(currentMonth)
    newDate.setMonth(monthIndex)
    setCurrentMonth(newDate)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          {/* Year and Month Selectors */}
          <div className="flex gap-2">
            <Select
              value={currentMonth.getFullYear().toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={months[currentMonth.getMonth()]}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Calendar */}
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange?.(date)
              setOpen(false)
            }}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
            initialFocus
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
