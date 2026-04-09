import { Video, CalendarCheck, Shield, Clock, Users, Star } from 'lucide-react'

const FEATURES = [
  {
    icon: Video,
    title: 'HD Video Consultations',
    description: 'Crystal-clear video calls powered by Google Meet infrastructure.',
    color: 'text-teal-500',
    bg: 'bg-teal-50',
  },
  {
    icon: CalendarCheck,
    title: 'Auto Calendar Invites',
    description: 'Both doctor and patient receive Google Calendar invites automatically.',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    icon: Shield,
    title: 'HIPAA Secure',
    description: 'End-to-end encrypted consultations with full data privacy compliance.',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    icon: Clock,
    title: '24/7 Availability',
    description: 'Book appointments any time. Our specialists are available round the clock.',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Users,
    title: '50+ Specialists',
    description: 'Access a wide range of medical specialties from general to niche care.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
  {
    icon: Star,
    title: 'Top Rated Doctors',
    description: 'Every doctor is verified, board-certified and highly reviewed by patients.',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Everything you need for virtual care
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            From booking to consultation, every step is seamless, secure, and automated.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
            <div
              key={title}
              className="p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={22} className={color} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
