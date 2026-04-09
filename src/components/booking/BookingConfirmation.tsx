import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { CheckCircle2, Video, Calendar, Clock, Mail, Copy, ExternalLink, Loader2 } from 'lucide-react'
import { useBookingStore } from '../../store/bookingStore'
import { Booking } from '../../types'
import { Avatar } from '../ui/Avatar'

// Simulates Google Calendar API call + Meet link generation
async function createGoogleCalendarEvent(
  doctor: NonNullable<ReturnType<typeof useBookingStore.getState>['selectedDoctor']>,
  slot: NonNullable<ReturnType<typeof useBookingStore.getState>['selectedSlot']>,
  patient: NonNullable<ReturnType<typeof useBookingStore.getState>['patientDetails']>
): Promise<{ meetLink: string; eventId: string }> {
  // Simulate API latency
  await new Promise((r) => setTimeout(r, 2200))

  // Generate a realistic-looking Google Meet code
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const meetCode = `${seg(3)}-${seg(4)}-${seg(3)}`

  return {
    meetLink: `https://meet.google.com/${meetCode}`,
    eventId: `evt_${Date.now()}`,
  }
}

export function BookingConfirmation() {
  const {
    selectedDoctor,
    selectedSlot,
    patientDetails,
    addBooking,
    closeModal,
    reset,
  } = useBookingStore()

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!selectedDoctor || !selectedSlot || !patientDetails) return

    createGoogleCalendarEvent(selectedDoctor, selectedSlot, patientDetails)
      .then(({ meetLink, eventId }) => {
        const newBooking: Booking = {
          id: `booking-${Date.now()}`,
          doctor: selectedDoctor,
          slot: selectedSlot,
          patient: patientDetails,
          meetLink,
          calendarEventId: eventId,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        }
        addBooking(newBooking)
        setBooking(newBooking)
        setStatus('success')
      })
      .catch(() => setStatus('error'))
  }, [])

  const handleCopy = async () => {
    if (!booking) return
    await navigator.clipboard.writeText(booking.meetLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDone = () => {
    reset()
    closeModal()
  }

  const dateLabel = (() => {
    if (!selectedSlot) return ''
    try {
      return format(parseISO(selectedSlot.date), 'EEEE, MMMM d, yyyy')
    } catch {
      return selectedSlot.date
    }
  })()

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center">
            <Loader2 size={36} className="text-teal-500 animate-spin" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <Calendar size={12} className="text-blue-500" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="font-bold text-gray-800 text-lg mb-1">Creating your booking</h3>
          <p className="text-gray-400 text-sm">
            Generating Google Meet link and sending calendar invites to both parties…
          </p>
        </div>
        <div className="flex flex-col gap-2 w-64">
          {[
            'Verifying slot availability',
            'Creating Google Calendar event',
            'Generating Meet link',
            'Sending invites',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-teal-300 border-t-teal-500 animate-spin" style={{ animationDelay: `${i * 0.2}s` }} />
              <span className="text-xs text-gray-500">{step}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <span className="text-3xl">😕</span>
        </div>
        <h3 className="font-bold text-gray-800 text-lg">Something went wrong</h3>
        <p className="text-gray-400 text-sm text-center">
          We couldn't create the calendar event. Please try again.
        </p>
        <button
          onClick={handleDone}
          className="mt-2 bg-gray-900 text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    )
  }

  // Success state
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
        {/* Success banner */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 size={28} className="text-white" />
              <h2 className="text-xl font-bold">Booking Confirmed!</h2>
            </div>
            <p className="text-teal-100 text-sm">
              Calendar invites have been sent to both the patient and doctor. Your Google Meet link is ready.
            </p>
          </div>
        </div>

        {/* Doctor & slot summary */}
        {selectedDoctor && selectedSlot && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar initials={selectedDoctor.avatar} size="sm" online />
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{selectedDoctor.name}</h3>
                <p className="text-teal-600 text-xs font-semibold">{selectedDoctor.specialty}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                  <Calendar size={11} /> Date
                </div>
                <p className="font-bold text-gray-800 text-sm">{dateLabel}</p>
              </div>
              <div className="bg-white rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                  <Clock size={11} /> Time
                </div>
                <p className="font-bold text-gray-800 text-sm">
                  {selectedSlot.startTime} – {selectedSlot.endTime}
                </p>
              </div>
              <div className="bg-white rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                  <Mail size={11} /> Patient Email
                </div>
                <p className="font-bold text-gray-800 text-xs truncate">{patientDetails?.email}</p>
              </div>
              <div className="bg-white rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                  <Mail size={11} /> Doctor Email
                </div>
                <p className="font-bold text-gray-800 text-xs truncate">
                  {selectedDoctor.calendarEmail.substring(0, 20)}...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Meet link */}
        {booking && (
          <div className="border-2 border-teal-200 bg-teal-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <Video size={16} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">Google Meet Link Generated</p>
                <p className="text-gray-400 text-xs">Ready to join at appointment time</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border border-teal-200 rounded-xl px-3 py-2 text-sm text-teal-700 font-mono truncate">
                {booking.meetLink}
              </code>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-teal-200 rounded-xl text-xs font-semibold text-teal-600 hover:bg-teal-100 transition-colors cursor-pointer flex-shrink-0"
              >
                <Copy size={13} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {booking && (
            <a
              href={booking.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              <Video size={16} />
              Join Meeting
              <ExternalLink size={13} />
            </a>
          )}
          <button
            onClick={handleDone}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm transition-colors cursor-pointer"
          >
            View in Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
