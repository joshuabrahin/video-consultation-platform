import { CheckCircle2, Star, Globe, Calendar, Video, RefreshCw, WifiOff } from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'
import { useBookingStore } from '../../store/bookingStore'
import { useDoctors } from '../../hooks/useDoctors'

export function DoctorSelectionPage() {
  const selectDoctor        = useBookingStore((s) => s.selectDoctor)
  const { doctors, isLoading, error, refetch } = useDoctors()

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Choose Your Doctor</h1>
          <p className="text-gray-500">Review specialists and choose who should handle the consultation.</p>
        </div>
        <div className="flex flex-col gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex gap-6 animate-pulse">
                <div className="w-[90px] flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-gray-200" />
                  <div className="w-14 h-3 bg-gray-200 rounded" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="w-48 h-5 bg-gray-200 rounded" />
                  <div className="w-28 h-4 bg-gray-100 rounded" />
                  <div className="w-full h-4 bg-gray-100 rounded" />
                  <div className="w-3/4 h-4 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Choose Your Doctor</h1>
          <p className="text-gray-500">Review specialists and choose who should handle the consultation.</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
          <WifiOff size={36} className="text-red-400" />
          <div>
            <p className="font-semibold text-red-700 mb-1">Could not load doctors</p>
            <p className="text-sm text-red-500">{error}</p>
            <p className="text-xs text-gray-400 mt-1">Make sure the backend is running on port 3001.</p>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (doctors.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Choose Your Doctor</h1>
          <p className="text-gray-500">Review specialists and choose who should handle the consultation.</p>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-10 text-center">
          <p className="text-gray-500 font-medium">No doctors found.</p>
          <p className="text-gray-400 text-sm mt-1">Run the seed script to add doctors to the database.</p>
          <code className="inline-block mt-3 bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-lg">
            cd backend &amp;&amp; npm run seed
          </code>
        </div>
      </div>
    )
  }

  // ── Doctor list ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Choose Your Doctor</h1>
        <p className="text-gray-500">
          Review specialists and choose who should handle the consultation.
        </p>
      </div>

      {/* Doctor cards */}
      <div className="flex flex-col gap-5">
        {doctors.map((doctor) => {
          const available = doctor.availableSlots.filter((s) => s.available).length

          return (
            <div
              key={doctor.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-teal-200 hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="p-6 flex gap-6">
                {/* Avatar column */}
                <div className="flex flex-col items-center gap-2 min-w-[90px]">
                  <Avatar initials={doctor.avatar} size="lg" online />
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest text-center">
                    Video Specialist
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Name + slots badge */}
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900">{doctor.name}</h2>
                      {doctor.isVerified && (
                        <CheckCircle2 size={18} className="text-teal-500 flex-shrink-0" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide flex-shrink-0 ${
                        available > 0
                          ? 'bg-teal-50 text-teal-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {available} Slots Available
                    </span>
                  </div>

                  <p className="text-teal-600 text-sm font-semibold mb-2">{doctor.specialty}</p>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{doctor.bio}</p>

                  {/* Meta row */}
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1 bg-gray-50 rounded-xl p-3">
                      <div className="text-xs text-gray-400 mb-0.5">Experience</div>
                      <div className="font-bold text-gray-800 text-sm">{doctor.experience}</div>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                        <Globe size={10} /> Languages
                      </div>
                      <div className="font-bold text-gray-800 text-sm">
                        {doctor.languages.join(', ')}
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                        <Calendar size={10} /> Calendar
                      </div>
                      <div className="font-bold text-gray-800 text-xs truncate">
                        {doctor.calendarEmail
                          ? `${doctor.calendarEmail.split('@')[0]}@...`
                          : 'Not set'}
                      </div>
                    </div>
                  </div>

                  {/* Rating + CTA */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={15}
                            className={
                              i < Math.floor(doctor.rating)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-200 fill-gray-200'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {doctor.rating} average consultation rating
                      </span>
                    </div>

                    <button
                      onClick={() => selectDoctor(doctor)}
                      disabled={available === 0}
                      className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors cursor-pointer"
                    >
                      <Video size={15} />
                      Book Video Consultation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
