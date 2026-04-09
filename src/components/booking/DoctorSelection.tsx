import { CheckCircle2, Star, Globe, Calendar } from 'lucide-react'
import { DOCTORS } from '../../data/doctors'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { useBookingStore } from '../../store/bookingStore'

export function DoctorSelection() {
  const selectDoctor = useBookingStore((s) => s.selectDoctor)

  const getAvailableCount = (doctorId: string) => {
    const doc = DOCTORS.find((d) => d.id === doctorId)
    return doc?.availableSlots.filter((s) => s.available).length ?? 0
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-xl font-bold text-gray-900">Choose Your Doctor</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Review specialists and choose who should handle the consultation.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 scrollbar-hide">
        {DOCTORS.map((doctor) => {
          const available = getAvailableCount(doctor.id)
          return (
            <div
              key={doctor.id}
              className="border border-gray-100 rounded-2xl p-4 hover:border-teal-200 hover:shadow-md transition-all duration-200 bg-white"
            >
              <div className="flex gap-4">
                {/* Avatar column */}
                <div className="flex flex-col items-center gap-1.5">
                  <Avatar initials={doctor.avatar} size="md" online />
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    Video Specialist
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-gray-900 text-base">{doctor.name}</h3>
                      {doctor.isVerified && (
                        <CheckCircle2 size={16} className="text-teal-500 flex-shrink-0" />
                      )}
                    </div>
                    <Badge variant={available > 0 ? 'teal' : 'gray'}>
                      {available} Slots Available
                    </Badge>
                  </div>

                  <p className="text-teal-600 text-sm font-semibold mb-2">{doctor.specialty}</p>
                  <p className="text-gray-500 text-sm leading-relaxed mb-3 line-clamp-2">
                    {doctor.bio}
                  </p>

                  {/* Meta row */}
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1 bg-gray-50 rounded-xl p-2.5">
                      <div className="text-xs text-gray-400 mb-0.5">Experience</div>
                      <div className="font-bold text-gray-800 text-sm">{doctor.experience}</div>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-2.5">
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                        <Globe size={10} />
                        Languages
                      </div>
                      <div className="font-bold text-gray-800 text-sm">
                        {doctor.languages.join(', ')}
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-2.5">
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                        <Calendar size={10} />
                        Calendar Invite
                      </div>
                      <div className="font-bold text-gray-800 text-xs truncate">
                        {doctor.calendarEmail.split('@')[0]}@...
                      </div>
                    </div>
                  </div>

                  {/* Rating & CTA */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
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
                      className="bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer"
                    >
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
