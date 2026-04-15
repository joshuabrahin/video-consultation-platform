export interface Doctor {
  id: string
  /** Numeric primary key on the backend (used when creating a booking) */
  backendId: number
  name: string
  specialty: string
  experience: string
  languages: string[]
  calendarEmail: string
  bio: string
  rating: number
  reviewCount: number
  avatar: string
  isVerified: boolean
  availableSlots: TimeSlot[]
}

export interface TimeSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  available: boolean
}

export interface PatientDetails {
  name: string
  email: string
  phone: string
  problem: string
  prescription?: File | null
}

export interface Booking {
  id: string
  /** Backend integer ID returned after real booking creation */
  backendId?: number
  doctor: Doctor
  slot: TimeSlot
  patient: PatientDetails
  meetLink: string
  calendarEventId?: string
  status: 'confirmed' | 'pending' | 'cancelled'
  createdAt: string
}

export type BookingStep = 'doctors' | 'slots' | 'details' | 'confirmation'
