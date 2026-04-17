import { useState, useEffect } from 'react'
import { addDays, format } from 'date-fns'
import type { Doctor, TimeSlot } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Shape returned by GET /api/doctors (NestJS backend)
// ─────────────────────────────────────────────────────────────────────────────

interface ApiDoctor {
  id: string
  name: string
  specialization: string
  calendarEmail: string | null
  hospitalId: string
  hospital: {
    id: string
    name: string
    location: string
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate fixed 30-minute time slots from 9:00 AM to 5:30 PM.
 * Returns 17 slots per day × 7 days = 119 slots total.
 * All slots are available by default (no random values).
 */
function generateTimeWindows(): Array<{ start: string; end: string }> {
  const windows: Array<{ start: string; end: string }> = []

  // Start: 9:00 AM (540 minutes from midnight)
  // End:   5:30 PM (1020 minutes from midnight) — last slot starts at 5:00 PM
  const START_MINUTES = 9 * 60        // 540
  const END_MINUTES   = 17 * 60 + 30  // 1050  (5:30 PM = last slot end)
  const INTERVAL      = 30

  for (let m = START_MINUTES; m < END_MINUTES; m += INTERVAL) {
    windows.push({
      start: minutesToTime(m),
      end:   minutesToTime(m + INTERVAL),
    })
  }

  return windows
}

/** Convert minutes-from-midnight to "hh:mm AM/PM" string. */
function minutesToTime(totalMinutes: number): string {
  const h24  = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  const ampm = h24 < 12 ? 'AM' : 'PM'
  const h12  = h24 % 12 === 0 ? 12 : h24 % 12
  return `${String(h12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`
}

/** Generate slots for 7 days starting today using the fixed time windows. */
function generateSlots(doctorId: string): TimeSlot[] {
  const windows = generateTimeWindows()
  const slots: TimeSlot[] = []

  for (let d = 0; d < 7; d++) {
    const date = format(addDays(new Date(), d), 'yyyy-MM-dd')
    windows.forEach((w, i) => {
      slots.push({
        id:        `${doctorId}-d${d}-t${i}`,
        date,
        startTime: w.start,
        endTime:   w.end,
        available: true,
      })
    })
  }

  return slots
}

/** Derive avatar initials from a full name. */
function toInitials(name: string): string {
  return name
    .replace(/^Dr\.\s*/i, '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** Map API doctor → frontend Doctor shape. */
function mapDoctor(api: ApiDoctor): Doctor {
  return {
    id:            api.id,
    name:          api.name,
    specialty:     api.specialization,
    calendarEmail: api.calendarEmail ?? '',
    avatar:        toInitials(api.name),
    isVerified:    true,
    availableSlots: generateSlots(api.id),
    // UI-only defaults (not stored in DB)
    experience:   'Experienced specialist',
    languages:    ['English'],
    bio:          `${api.name} is a specialist in ${api.specialization} at ${api.hospital.name}.`,
    rating:       4.8,
    reviewCount:  0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

interface UseDoctorsResult {
  doctors: Doctor[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useDoctors(): UseDoctorsResult {
  const [doctors, setDoctors]     = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [tick, setTick]           = useState(0)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetch('/api/doctors')
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`)
        return res.json() as Promise<ApiDoctor[]>
      })
      .then((data) => {
        if (!cancelled) setDoctors(data.map(mapDoctor))
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [tick])

  return {
    doctors,
    isLoading,
    error,
    refetch: () => setTick((t) => t + 1),
  }
}
