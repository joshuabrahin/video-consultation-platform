import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { ChevronLeft, Calendar, Clock, Mail } from 'lucide-react'
import { useBookingStore } from '../../store/bookingStore'
import { Avatar } from '../../components/ui/Avatar'
import { cn } from '../../lib/utils'
import { TimeSlot } from '../../types'

// ── API shape returned by GET /api/doctors/:id/slots ─────────────────────────
interface DbSlot {
  id: string
  startAt: string // ISO string
  endAt: string   // ISO string
  isBooked: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toLocalDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toLocalTime(iso: string): string {
  const d    = new Date(iso)
  const h24  = d.getHours()
  const mins = d.getMinutes()
  const ampm = h24 < 12 ? 'AM' : 'PM'
  const h12  = h24 % 12 === 0 ? 12 : h24 % 12
  return `${String(h12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`
}

function dbSlotToTimeSlot(s: DbSlot): TimeSlot {
  return {
    id:        s.id,
    date:      toLocalDate(s.startAt),
    startTime: toLocalTime(s.startAt),
    endTime:   toLocalTime(s.endAt),
    available: !s.isBooked,
  }
}

// Generate the next N date strings (YYYY-MM-DD) starting today
function nextDates(n = 7): string[] {
  return Array.from({ length: n }, (_, i) =>
    format(addDays(new Date(), i), 'yyyy-MM-dd'),
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SlotSelectionPage() {
  const { selectedDoctor, selectSlot, setStep } = useBookingStore()

  const dates = nextDates(7)
  const [activeDateStr, setActiveDateStr] = useState<string>(dates[0])
  const [slots, setSlots]                 = useState<TimeSlot[]>([])
  const [loading, setLoading]             = useState(false)

  useEffect(() => {
    if (!selectedDoctor) return
    setLoading(true)
    fetch(`/api/doctors/${selectedDoctor.id}/slots?date=${activeDateStr}`)
      .then((r) => r.json() as Promise<DbSlot[]>)
      .then((data) => setSlots(data.map(dbSlotToTimeSlot)))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [selectedDoctor?.id, activeDateStr])

  if (!selectedDoctor) return null

  const availableSlots   = slots.filter((s) => s.available)
  const unavailableSlots = slots.filter((s) => !s.available)

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => setStep('doctors')}
        className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm mb-6 transition-colors cursor-pointer"
      >
        <ChevronLeft size={16} /> Back to doctors
      </button>

      <div className="flex gap-8 items-start">
        {/* Left: slots */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Select a Video Consultation Slot</h1>
          <p className="text-gray-500 mb-8">Choose an available slot with {selectedDoctor.name}.</p>

          {/* Date strip */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Available Dates</span>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {dates.map((dateStr) => {
                const d        = new Date(dateStr + 'T00:00:00')
                const isActive = dateStr === activeDateStr
                return (
                  <button
                    key={dateStr}
                    onClick={() => setActiveDateStr(dateStr)}
                    className={cn(
                      'flex flex-col items-center px-5 py-3 rounded-xl text-sm font-semibold transition-all flex-shrink-0 cursor-pointer',
                      isActive
                        ? 'bg-teal-500 text-white shadow-md shadow-teal-500/25'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-teal-300',
                    )}
                  >
                    <span className={cn('text-xs mb-0.5', isActive ? 'text-teal-100' : 'text-gray-400')}>
                      {format(d, 'EEE')}
                    </span>
                    <span className="text-lg font-bold">{format(d, 'd')}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time slots */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                {format(new Date(activeDateStr + 'T00:00:00'), 'MMMM d, yyyy')} — Available Times
              </span>
              {loading && (
                <span className="text-xs text-teal-500 animate-pulse ml-2">Loading slots…</span>
              )}
            </div>

            {!loading && slots.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
                <Clock size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No slots available for this date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {slots.map((slot) =>
                  slot.available ? (
                    <button
                      key={slot.id}
                      onClick={() => selectSlot(slot)}
                      className="flex flex-col items-center gap-0.5 py-4 px-3 rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold transition-all hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 cursor-pointer"
                    >
                      <span className="text-base font-bold">{slot.startTime}</span>
                      <span className="text-xs text-gray-400">to {slot.endTime}</span>
                    </button>
                  ) : (
                    <div
                      key={slot.id}
                      className="flex flex-col items-center gap-0.5 py-4 px-3 rounded-xl border border-dashed border-red-100 bg-red-50 cursor-not-allowed"
                    >
                      <span className="text-base font-bold text-gray-300 line-through">{slot.startTime}</span>
                      <span className="text-xs text-red-400 font-bold tracking-wide">Booked</span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: doctor summary card */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-28">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Doctor</p>
            <div className="flex items-center gap-3 mb-4">
              <Avatar initials={selectedDoctor.avatar} size="md" online />
              <div>
                <h3 className="font-bold text-gray-900">{selectedDoctor.name}</h3>
                <p className="text-teal-600 text-sm font-semibold">{selectedDoctor.specialty}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Experience</span>
                <span className="font-semibold text-gray-800">{selectedDoctor.experience}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-400 flex items-center gap-1"><Mail size={11} /> Calendar</span>
                <span className="font-semibold text-gray-800 text-xs text-right truncate max-w-[140px]">{selectedDoctor.calendarEmail}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
