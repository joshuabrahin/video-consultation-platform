import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Booking, Doctor, TimeSlot, PatientDetails, BookingStep } from '../types'

interface BookingState {
  currentStep: BookingStep
  selectedDoctor: Doctor | null
  selectedSlot: TimeSlot | null
  patientDetails: PatientDetails | null
  prescriptionFile: File | null
  bookings: Booking[]

  setStep: (step: BookingStep) => void
  selectDoctor: (doctor: Doctor) => void
  selectSlot: (slot: TimeSlot) => void
  setPatientDetails: (details: PatientDetails) => void
  setPrescriptionFile: (file: File | null) => void
  addBooking: (booking: Booking) => void
  cancelBooking: (bookingId: string) => void
  reset: () => void
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      currentStep: 'doctors',
      selectedDoctor: null,
      selectedSlot: null,
      patientDetails: null,
      prescriptionFile: null,
      bookings: [
        {
          id: 'demo-booking-1',
          doctor: {
            id: 'dr-marcus-webb',
            name: 'Dr. Marcus Webb',
            specialty: 'General Physician',
            experience: '9 years',
            languages: ['English'],
            calendarEmail: 'marcus.webb@telehealthplus.com',
            bio: 'Primary care doctor helping patients with general consultations.',
            rating: 4.7,
            reviewCount: 192,
            avatar: 'MW',
            isVerified: true,
            availableSlots: [],
          },
          slot: {
            id: 'demo-slot-1',
            date: '2026-04-04',
            startTime: '11:00 AM',
            endTime: '11:30 AM',
            available: false,
          },
          patient: {
            name: 'John Doe',
            email: 'patient@example.com',
            phone: '+94 77 123 4567',
            problem: 'Recurring fever and fatigue over the last three days.',
          },
          meetLink: 'https://meet.google.com/demo-link',
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        },
      ],

      setStep: (step) => set({ currentStep: step }),
      selectDoctor: (doctor) => set({ selectedDoctor: doctor, currentStep: 'slots' }),
      selectSlot: (slot) => set({ selectedSlot: slot, currentStep: 'details' }),
      setPatientDetails: (details) => set({ patientDetails: details }),
      setPrescriptionFile: (file) => set({ prescriptionFile: file }),
      addBooking: (booking) =>
        set((state) => ({ bookings: [booking, ...state.bookings] })),
      cancelBooking: (bookingId) =>
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
          ),
        })),
      reset: () =>
        set({
          currentStep: 'doctors',
          selectedDoctor: null,
          selectedSlot: null,
          patientDetails: null,
          prescriptionFile: null,
        }),
    }),
    {
      name: 'healthconnect-v3',
      partialize: (state) => ({ bookings: state.bookings }),
    }
  )
)
