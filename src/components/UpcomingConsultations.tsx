import { useEffect, useState, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { Calendar, Clock, User, Mail, FileText, Video, X, Stethoscope, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useBookingStore } from '../store/bookingStore'
import { useChatStore } from '../store/useChatStore'
import { apiGet, apiPatch } from '../lib/api'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Avatar } from './ui/Avatar'
import { Booking } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Backend booking shape returned by GET /bookings/by-email
// ─────────────────────────────────────────────────────────────────────────────

interface BackendBooking {
  id: string
  name: string
  patientEmail: string
  problem: string
  date: string
  meetLink: string
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  doctor: {
    id: string
    name: string
    specialization: string
  }
}

// Map a backend booking to the frontend Booking type for rendering.
// Times are displayed in the CLIENT's local timezone (matching what the user booked).
function adaptBackendBooking(b: BackendBooking): Booking {
  const date = new Date(b.date)
  // Use local-time accessors so times display correctly in the user's timezone
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const meridiem = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 === 0 ? 12 : hours % 12
  const startTime = `${String(h12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`
  const endDate = new Date(date.getTime() + 30 * 60 * 1000)
  const endHours = endDate.getHours()
  const eh12 = endHours % 12 === 0 ? 12 : endHours % 12
  const eMeridiem = endHours >= 12 ? 'PM' : 'AM'
  const endTime = `${String(eh12).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')} ${eMeridiem}`

  const avatarInitials = b.doctor.name
    .split(' ')
    .filter((w) => w.length > 0)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('')

  return {
    id: b.id,
    doctor: {
      id: b.doctor.id,
      name: b.doctor.name,
      specialty: b.doctor.specialization,
      experience: '',
      languages: [],
      calendarEmail: '',
      bio: '',
      rating: 0,
      reviewCount: 0,
      avatar: avatarInitials,
      isVerified: true,
      availableSlots: [],
    },
    slot: {
      id: `slot-${b.id}`,
      date: format(date, 'yyyy-MM-dd'),
      startTime,
      endTime,
      available: false,
    },
    patient: {
      name: b.name,
      email: b.patientEmail,
      phone: '',
      problem: b.problem,
    },
    meetLink: b.meetLink,
    status: b.status === 'CANCELLED' ? 'cancelled' : 'confirmed',
    createdAt: b.date,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BookingCard
// ─────────────────────────────────────────────────────────────────────────────

function BookingCard({ booking, isReal, onCancelled }: { booking: Booking; isReal?: boolean; onCancelled?: (id: string) => void }) {
  const cancelBooking = useBookingStore((s) => s.cancelBooking)
  const { setContext, toggleChat } = useChatStore()
  const [cancelling, setCancelling] = useState(false)

  function openChat() {
    setContext({ bookingId: booking.id, doctorName: booking.doctor.name })
    toggleChat()
  }

  async function handleCancel() {
    if (!confirm('Cancel this booking?')) return
    if (isReal) {
      setCancelling(true)
      try {
        await apiPatch(`/bookings/${booking.id}/cancel`)
        onCancelled?.(booking.id)
      } catch {
        alert('Failed to cancel booking. Please try again.')
      } finally {
        setCancelling(false)
      }
    } else {
      cancelBooking(booking.id)
    }
  }

  const dateLabel = (() => {
    try {
      return format(parseISO(booking.slot.date), 'EEEE, MMMM d, yyyy')
    } catch {
      return booking.slot.date
    }
  })()

  if (booking.status === 'cancelled') return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden card-hover">
      {/* Top gradient bar */}
      <div className="gradient-border" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Upcoming Consultation
            </p>
            <div className="flex items-center gap-2">
              <Avatar initials={booking.doctor.avatar} size="sm" online />
              <div>
                <h3 className="font-bold text-gray-900 text-base">{booking.doctor.name}</h3>
                <p className="text-teal-600 text-xs font-semibold">{booking.doctor.specialty}</p>
              </div>
            </div>
          </div>
          <Badge variant={isReal ? 'teal' : 'green'}>
            <span className={`w-1.5 h-1.5 rounded-full ${isReal ? 'bg-teal-500' : 'bg-green-500'}`} />
            {isReal ? 'Confirmed' : 'Demo Booking'}
          </Badge>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
              <Calendar size={12} />
              Date
            </div>
            <p className="font-semibold text-gray-800 text-sm">{dateLabel}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
              <Clock size={12} />
              Time
            </div>
            <p className="font-semibold text-gray-800 text-sm">
              {booking.slot.startTime} to {booking.slot.endTime}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
              <User size={12} />
              Patient
            </div>
            <p className="font-semibold text-gray-800 text-sm">{booking.patient.name}</p>
            {booking.patient.phone && (
              <p className="text-gray-400 text-xs">{booking.patient.phone}</p>
            )}
          </div>
          {booking.patient.email && (
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                <Mail size={12} />
                Invitee Email
              </div>
              <p className="font-semibold text-gray-800 text-sm truncate">{booking.patient.email}</p>
            </div>
          )}
        </div>

        {/* Notes */}
        {booking.patient.problem && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Consultation Notes
            </p>
            <p className="text-gray-700 text-sm leading-relaxed">{booking.patient.problem}</p>
            {!isReal && (
              <button className="flex items-center gap-1.5 mt-2 text-xs text-teal-600 hover:text-teal-700 font-medium">
                <FileText size={12} />
                cbc-report.pdf
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={booking.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <button className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors cursor-pointer">
              <Video size={16} />
              Join Now
            </button>
          </a>
          <button
            onClick={openChat}
            title="Chat about this consultation"
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-teal-100 text-teal-500 hover:bg-teal-50 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <MessageCircle size={16} />
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// UpcomingConsultations
// ─────────────────────────────────────────────────────────────────────────────

export function UpcomingConsultations() {
  const navigate = useNavigate()
  const { bookings } = useBookingStore()
  const [realBookings, setRealBookings] = useState<Booking[]>([])

  const handleRealCancelled = useCallback((id: string) => {
    setRealBookings((prev) => prev.filter((b) => b.id !== id))
  }, [])

  // Derive the most recently used patient email from local bookings
  // so we can fetch the latest DB state without requiring login
  const lastEmail = bookings
    .filter((b) => b.patient.email)
    .at(0)?.patient.email

  useEffect(() => {
    if (!lastEmail) return
    apiGet<BackendBooking[]>(`/bookings/by-email?email=${encodeURIComponent(lastEmail)}`)
      .then((data) => setRealBookings(data.map(adaptBackendBooking)))
      .catch(() => { /* silent — show local store bookings on error */ })
  }, [lastEmail])

  // IDs already held in local store (avoids duplicates when backend returns same booking)
  const localIds = new Set(bookings.map((b) => b.id))

  // Backend bookings not already in local store
  const realActive = realBookings.filter(
    (rb) => rb.status !== 'cancelled' && !localIds.has(rb.id),
  )

  // Local store bookings (may include bookings just confirmed this session)
  const localActive = bookings.filter((b) => b.status !== 'cancelled')

  const allActive = [...realActive, ...localActive]

  return (
    <section className="py-20 px-6" style={{ background: 'linear-gradient(180deg, #f8f9fa 0%, #fff8f0 100%)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-6 bg-teal-500 rounded-full" />
            <h2 className="text-3xl font-bold text-gray-900">Upcoming Video Consultations</h2>
          </div>
          <p className="text-gray-500 ml-7">
            Every confirmed booking appears here with the generated join button and appointment details.
          </p>
        </div>

        <div className="flex gap-8 items-start">
          {/* Bookings list */}
          <div className="flex-1">
            {allActive.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar size={28} className="text-teal-400" />
                </div>
                <h3 className="font-semibold text-gray-700 mb-2">No upcoming consultations</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Book your first video consultation with one of our specialists.
                </p>
                <Button variant="secondary" onClick={() => navigate('/book')}>
                  <Video size={16} />
                  Book Now
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {realActive.map((b) => (
                  <BookingCard key={b.id} booking={b} isReal onCancelled={handleRealCancelled} />
                ))}
                {localActive.map((b) => (
                  <BookingCard key={b.id} booking={b} isReal={false} />
                ))}
              </div>
            )}
          </div>

          {/* Right illustration */}
          <div className="hidden lg:flex flex-col items-center justify-center w-64 opacity-20">
            <Stethoscope size={180} className="text-gray-400" strokeWidth={0.8} />
          </div>
        </div>
      </div>
    </section>
  )
}
