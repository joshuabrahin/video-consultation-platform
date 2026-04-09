import { useState } from 'react'
import { format, parseISO, isSameDay } from 'date-fns'
import { ChevronLeft, Calendar, Clock } from 'lucide-react'
import { useBookingStore } from '../../store/bookingStore'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../lib/utils'
import { TimeSlot } from '../../types'

export function SlotSelection() {
  const { selectedDoctor, selectSlot, setStep } = useBookingStore()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)

  if (!selectedDoctor) return null

  // Get unique available dates
  const allSlots = selectedDoctor.availableSlots
  const uniqueDates = [...new Set(allSlots.map((s) => s.date))].sort()
  const activeDateStr = selectedDate ?? uniqueDates[0] ?? null

  const slotsForDate: TimeSlot[] = activeDateStr
    ? allSlots.filter((s) => s.date === activeDateStr)
    : []

  const availableSlots = slotsForDate.filter((s) => s.available)
  const unavailableSlots = slotsForDate.filter((s) => !s.available)

  const formatDayLabel = (dateStr: string) => {
    try {
      const d = parseISO(dateStr)
      return { day: format(d, 'EEE'), date: format(d, 'd') }
    } catch {
      return { day: '?', date: '?' }
    }
  }

  const formatDateFull = (dateStr: string | null) => {
    if (!dateStr) return ''
    try {
      return format(parseISO(dateStr), 'MMMM d, yyyy')
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <button
          onClick={() => setStep('doctors')}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-3 transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          Back to doctors
        </button>
        <h2 className="text-xl font-bold text-gray-900">Select a Video Consultation Slot</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Choose an available slot with {selectedDoctor.name}.
        </p>

        {/* Doctor mini card */}
        <div className="mt-4 p-4 bg-gray-50 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <Avatar initials={selectedDoctor.avatar} size="sm" online />
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{selectedDoctor.name}</h3>
              <p className="text-teal-600 text-xs font-semibold">{selectedDoctor.specialty}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-xl p-2.5 text-center">
              <div className="text-xs text-gray-400 mb-0.5">Experience</div>
              <div className="font-bold text-gray-800 text-sm">{selectedDoctor.experience}</div>
            </div>
            <div className="bg-white rounded-xl p-2.5 text-center">
              <div className="text-xs text-gray-400 mb-0.5">Calendar Invite</div>
              <div className="font-bold text-gray-800 text-xs truncate">
                {selectedDoctor.calendarEmail.substring(0, 18)}...
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
        {/* Date picker */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Available Dates
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {uniqueDates.map((dateStr) => {
              const { day, date } = formatDayLabel(dateStr)
              const isActive = dateStr === activeDateStr
              const hasSlots = allSlots.some((s) => s.date === dateStr && s.available)
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0 cursor-pointer',
                    isActive
                      ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30'
                      : hasSlots
                      ? 'bg-white border border-gray-200 text-gray-700 hover:border-teal-300'
                      : 'bg-gray-50 border border-gray-100 text-gray-300 cursor-not-allowed'
                  )}
                  disabled={!hasSlots}
                >
                  <span className={cn('text-xs', isActive ? 'text-teal-100' : 'text-gray-400')}>
                    {day}
                  </span>
                  <span className="text-base font-bold">{date}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Time slots */}
        {activeDateStr && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                {formatDateFull(activeDateStr)} — Available Times
              </span>
            </div>

            {availableSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Clock size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No available slots for this date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => selectSlot(slot)}
                    onMouseEnter={() => setHoveredSlot(slot.id)}
                    onMouseLeave={() => setHoveredSlot(null)}
                    className={cn(
                      'flex flex-col items-center gap-0.5 py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all duration-150 cursor-pointer',
                      hoveredSlot === slot.id
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300'
                    )}
                  >
                    <span className="text-base font-bold">{slot.startTime}</span>
                    <span className="text-xs text-gray-400">to {slot.endTime}</span>
                  </button>
                ))}
              </div>
            )}

            {unavailableSlots.length > 0 && (
              <>
                <p className="text-xs text-gray-400 mb-2">Unavailable slots</p>
                <div className="grid grid-cols-3 gap-2">
                  {unavailableSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex flex-col items-center gap-0.5 py-3 px-2 rounded-xl border border-dashed border-gray-200 bg-gray-50"
                    >
                      <span className="text-sm font-bold text-gray-300">{slot.startTime}</span>
                      <span className="text-xs text-gray-200">to {slot.endTime}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
