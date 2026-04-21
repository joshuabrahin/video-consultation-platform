import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { CheckCircle2, Video, Calendar, Clock, Mail, Copy, ExternalLink, Loader2 } from 'lucide-react'
import { useBookingStore } from '../../store/bookingStore'
import { useChatStore } from '../../store/useChatStore'
import { apiPost } from '../../lib/api'
import { Booking } from '../../types'
import { Avatar } from '../../components/ui/Avatar'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a date string ('yyyy-MM-dd') + time string ('09:00 AM') into a
 * full UTC ISO-8601 string so the backend always receives unambiguous time,
 * regardless of server timezone.
 */
function slotToISO(date: string, startTime: string): string {
  const [time, meridiem] = startTime.split(' ')
  const [hoursStr, minutesStr] = time.split(':')
  let hours = parseInt(hoursStr, 10)
  const minutes = parseInt(minutesStr, 10)
  if (meridiem === 'PM' && hours !== 12) hours += 12
  if (meridiem === 'AM' && hours === 12) hours = 0
  // Build a local Date, then let toISOString() convert to UTC with Z suffix.
  // This ensures the stored time matches what the user selected in their timezone.
  const local = new Date(
    parseInt(date.slice(0, 4)),   // year
    parseInt(date.slice(5, 7)) - 1, // month (0-indexed)
    parseInt(date.slice(8, 10)),  // day
    hours,
    minutes,
  )
  return local.toISOString()
}

// ─────────────────────────────────────────────────────────────────────────────
// Backend response shape
// ─────────────────────────────────────────────────────────────────────────────

interface CreateBookingResponse {
  id: string
  meetLink: string
  date: string
  status: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading steps shown during booking creation
// ─────────────────────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  'Verifying slot availability',
  'Creating Google Calendar event',
  'Generating Meet link',
  'Scheduling Recall.ai scribe',
]

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function ConfirmationPage() {
  const navigate = useNavigate()
  const { selectedDoctor, selectedSlot, patientDetails, addBooking, reset } = useBookingStore()
  const setContext = useChatStore((s) => s.setContext)

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [copied, setCopied] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)

  // Guard: if booking state is empty (e.g. direct URL navigation), go back to step 1
  useEffect(() => {
    if (!selectedDoctor || !selectedSlot || !patientDetails) {
      navigate('/book', { replace: true })
      return
    }
  }, [selectedDoctor, selectedSlot, patientDetails, navigate])

  useEffect(() => {
    if (!selectedDoctor || !selectedSlot || !patientDetails) return

    // Animate through loading steps while the request runs
    const timers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setLoadingStep(i), i * 600),
    )

    const run = async () => {
      try {
        const startISO = slotToISO(selectedSlot.date, selectedSlot.startTime)

        // Convert prescription file to base64 string if one was attached
        let prescriptionStr: string | undefined
        if (patientDetails.prescription instanceof File) {
          const file = patientDetails.prescription
          prescriptionStr = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(`${file.name}|${(reader.result as string).split(',')[1]}`)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
        } else if (typeof patientDetails.prescription === 'string') {
          prescriptionStr = patientDetails.prescription
        }

        const data = await apiPost<CreateBookingResponse>('/bookings/video-consultation', {
          doctor: {
            id: selectedDoctor.id,
            calendarEmail: selectedDoctor.calendarEmail,
          },
          patient: {
            name:         patientDetails.name,
            email:        patientDetails.email,
            problem:      patientDetails.problem,
            prescription: prescriptionStr,
          },
          start: startISO,
        })

        const newBooking: Booking = {
          id: data.id,
          doctor: selectedDoctor,
          slot: selectedSlot,
          patient: patientDetails,
          meetLink: data.meetLink,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        }

        addBooking(newBooking)
        setBooking(newBooking)

        // Give the AI chat context so "summarize my consultation" works immediately
        setContext({
          bookingId: String(data.id),
          doctorName: selectedDoctor.name,
        })

        setStatus('success')
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Booking failed')
        setStatus('error')
      }
    }

    void run()
    return () => timers.forEach(clearTimeout)
  }, [])

  const handleCopy = async () => {
    if (!booking) return
    await navigator.clipboard.writeText(booking.meetLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDone = () => { reset(); navigate('/') }

  const dateLabel = (() => {
    if (!selectedSlot) return ''
    try { return format(parseISO(selectedSlot.date), 'EEEE, MMMM d, yyyy') }
    catch { return selectedSlot.date }
  })()

  /* ── Loading ── */
  if (status === 'loading') {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-6">
          <Loader2 size={36} className="text-teal-500 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating your booking</h2>
        <p className="text-gray-400 text-sm mb-10">Generating Google Meet link and scheduling the Recall.ai scribe…</p>
        <div className="flex flex-col gap-3 text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {LOADING_STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              {i <= loadingStep ? (
                <CheckCircle2 size={16} className="text-teal-500 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-200 flex-shrink-0" />
              )}
              <span className={`text-sm ${i <= loadingStep ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ── Error ── */
  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-500 text-sm mb-2">We couldn't confirm your booking.</p>
        {errorMsg && (
          <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6 text-left">
            {errorMsg}
          </p>
        )}
        <button
          onClick={handleDone}
          className="bg-gray-900 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Back to Home
        </button>
      </div>
    )
  }

  /* ── Success ── */
  return (
    <div className="max-w-2xl mx-auto">
      {/* Success banner */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-8 text-white mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={30} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1">Booking Confirmed!</h1>
            <p className="text-teal-100 text-sm">
              Your booking is saved and the AI medical scribe has been scheduled to join the call.
            </p>
          </div>
        </div>
      </div>

      {/* Details + Meet link */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        {selectedDoctor && selectedSlot && (
          <>
            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
              <Avatar initials={selectedDoctor.avatar} size="md" online />
              <div>
                <h3 className="font-bold text-gray-900">{selectedDoctor.name}</h3>
                <p className="text-teal-600 text-sm font-semibold">{selectedDoctor.specialty}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1"><Calendar size={11} /> Date</div>
                <p className="font-bold text-gray-800 text-sm">{dateLabel}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1"><Clock size={11} /> Time</div>
                <p className="font-bold text-gray-800 text-sm">{selectedSlot.startTime} – {selectedSlot.endTime}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1"><Mail size={11} /> Patient Email</div>
                <p className="font-bold text-gray-800 text-xs truncate">{patientDetails?.email}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1"><Mail size={11} /> Doctor Email</div>
                <p className="font-bold text-gray-800 text-xs truncate">{selectedDoctor.calendarEmail}</p>
              </div>
            </div>
          </>
        )}

        {/* Meet link */}
        {booking && (
          <div className="border-2 border-teal-200 bg-teal-50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
                <Video size={17} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">Google Meet Link Generated</p>
                <p className="text-gray-400 text-xs">Ready to join at appointment time</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border border-teal-200 rounded-xl px-3 py-2.5 text-sm text-teal-700 font-mono truncate">
                {booking.meetLink}
              </code>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-teal-200 rounded-xl text-xs font-semibold text-teal-600 hover:bg-teal-100 transition-colors cursor-pointer flex-shrink-0"
              >
                <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {booking && (
          <a href={booking.meetLink} target="_blank" rel="noopener noreferrer" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl text-sm transition-colors cursor-pointer">
              <Video size={16} /> Join Meeting <ExternalLink size={13} />
            </button>
          </a>
        )}
        <button
          onClick={handleDone}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl text-sm transition-colors cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}
