import { format, parseISO } from 'date-fns'
import { Calendar, Clock, User, Mail, FileText, Video, X, Stethoscope } from 'lucide-react'
import { useBookingStore } from '../store/bookingStore'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Avatar } from './ui/Avatar'
import { Booking } from '../types'

function BookingCard({ booking }: { booking: Booking }) {
  const cancelBooking = useBookingStore((s) => s.cancelBooking)

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
          <Badge variant="green">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Demo Booking
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
            <p className="text-gray-400 text-xs">{booking.patient.phone}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
              <Mail size={12} />
              Invitee Email
            </div>
            <p className="font-semibold text-gray-800 text-sm truncate">{booking.patient.email}</p>
            <p className="text-gray-400 text-xs truncate">{booking.doctor.calendarEmail}</p>
          </div>
        </div>

        {/* Notes */}
        {booking.patient.problem && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Consultation Notes
            </p>
            <p className="text-gray-700 text-sm leading-relaxed">{booking.patient.problem}</p>
            <button className="flex items-center gap-1.5 mt-2 text-xs text-teal-600 hover:text-teal-700 font-medium">
              <FileText size={12} />
              cbc-report.pdf
            </button>
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
            <button className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
              <Video size={16} />
              Join Now
            </button>
          </a>
          <button
            onClick={() => cancelBooking(booking.id)}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function UpcomingConsultations() {
  const { bookings, openModal } = useBookingStore()
  const activeBookings = bookings.filter((b) => b.status !== 'cancelled')

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
            {activeBookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar size={28} className="text-teal-400" />
                </div>
                <h3 className="font-semibold text-gray-700 mb-2">No upcoming consultations</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Book your first video consultation with one of our specialists.
                </p>
                <Button variant="secondary" onClick={openModal}>
                  <Video size={16} />
                  Book Now
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {activeBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
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
