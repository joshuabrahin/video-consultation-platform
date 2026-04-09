import { Video, CalendarCheck, Link2, Shield, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Each row: its own color scheme matching reference exactly
// Row 1: blue,  Row 2: teal,  Row 3: white/gray
const ROWS = [
  {
    left: 'Choose Doctor',
    right: 'Calendar Invites',
    color: '56,139,253',        // blue
    labelColor: 'rgba(56,139,253,1)',
  },
  {
    left: 'Select Time Slot',
    right: 'Google Meet Link',
    color: '45,212,191',        // teal
    labelColor: 'rgba(45,212,191,1)',
  },
  {
    left: 'Patient Details',
    right: 'Secure Consultation',
    color: '190,200,220',       // soft white/gray
    labelColor: 'rgba(210,220,235,0.85)',
  },
]

// ViewBox: 1440 × 900
// Labels + curve origins at y = 560, 620, 680
// Curves dip to y ≈ 780–810 in center → feels like bottom of viewport
function curvePath(y: number, dip: number) {
  const cx = 720
  return `M 4,${y} C 360,${y} 440,${dip} ${cx},${dip} C ${1440 - 440},${dip} ${1440 - 360},${y} 1436,${y}`
}

const ROW_Y  = [555, 620, 685]
const ROW_DIP = [790, 810, 828]

export function HeroSection() {
  const navigate = useNavigate()
  const openModal = () => navigate('/book')

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        minHeight: '100vh',
        // Near-pure black with very subtle dark-navy glow top-right only
        background:
          'radial-gradient(ellipse 55% 45% at 82% 10%, rgba(25,35,90,0.55) 0%, rgba(10,12,40,0.2) 55%, transparent 75%), #060609',
      }}
    >
      {/* ── Full-bleed SVG: labels + curves in one coordinate space ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {ROWS.map(({ color }, i) => (
            <linearGradient key={i} id={`lg${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor={`rgba(${color},0)`} />
              <stop offset="18%"  stopColor={`rgba(${color},0.28)`} />
              <stop offset="50%"  stopColor={`rgba(${color},0.55)`} />
              <stop offset="82%"  stopColor={`rgba(${color},0.28)`} />
              <stop offset="100%" stopColor={`rgba(${color},0)`} />
            </linearGradient>
          ))}
        </defs>

        {ROWS.map(({ left, right, color, labelColor }, i) => {
          const y      = ROW_Y[i]
          const dip    = ROW_DIP[i]
          const d      = curvePath(y, dip)
          const delay  = `${i * 1.4}s`
          const dur    = `${4.2 + i * 0.5}s`
          const pid    = `c${i}`

          return (
            <g key={i}>
              {/* Base gradient stroke */}
              <path id={pid} d={d} fill="none" stroke={`url(#lg${i})`} strokeWidth={1.5 - i * 0.1} />

              {/* Marching dashes */}
              <path d={d} fill="none" stroke={`rgba(${color},0.45)`}
                strokeWidth={1 - i * 0.08} strokeDasharray="14 52" strokeLinecap="round">
                <animate attributeName="stroke-dashoffset" from="0" to="-66"
                  dur={dur} begin={delay} repeatCount="indefinite" />
              </path>

              {/* Traveling glow dot */}
              <circle r="5.5" fill={`rgba(${color},0.95)`} filter="url(#glow)">
                <animateMotion dur={dur} begin={delay} repeatCount="indefinite" rotate="auto">
                  <mpath href={`#${pid}`} />
                </animateMotion>
              </circle>
              {/* Soft halo */}
              <circle r="13" fill={`rgba(${color},0.1)`} filter="url(#glow)">
                <animateMotion dur={dur} begin={delay} repeatCount="indefinite" rotate="auto">
                  <mpath href={`#${pid}`} />
                </animateMotion>
              </circle>

              {/* Left endpoint dot + pulse ring */}
              <circle cx="4" cy={y} r="4" fill={`rgba(${color},0.95)`} filter="url(#glow)">
                <animate attributeName="r" values="4;5.5;4" dur="2.6s" begin={delay} repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.5;1" dur="2.6s" begin={delay} repeatCount="indefinite" />
              </circle>
              <circle cx="4" cy={y} r="9" fill="none" stroke={`rgba(${color},0.35)`} strokeWidth="1">
                <animate attributeName="r" values="6;14;6" dur="2.6s" begin={delay} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0;0.7" dur="2.6s" begin={delay} repeatCount="indefinite" />
              </circle>

              {/* Right endpoint dot + pulse ring */}
              <circle cx="1436" cy={y} r="4" fill={`rgba(${color},0.95)`} filter="url(#glow)">
                <animate attributeName="r" values="4;5.5;4" dur="2.6s" begin={`${i * 1.4 + 2.1}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.5;1" dur="2.6s" begin={`${i * 1.4 + 2.1}s`} repeatCount="indefinite" />
              </circle>
              <circle cx="1436" cy={y} r="9" fill="none" stroke={`rgba(${color},0.35)`} strokeWidth="1">
                <animate attributeName="r" values="6;14;6" dur="2.6s" begin={`${i * 1.4 + 2.1}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0;0.7" dur="2.6s" begin={`${i * 1.4 + 2.1}s`} repeatCount="indefinite" />
              </circle>

              {/* Left label */}
              <text x="20" y={y + 5} fontSize="13" fontWeight="600"
                fontFamily="system-ui,-apple-system,sans-serif"
                fill={labelColor} letterSpacing="0.15">
                {left}
              </text>

              {/* Right label */}
              <text x="1420" y={y + 5} fontSize="13" fontWeight="600"
                fontFamily="system-ui,-apple-system,sans-serif"
                fill={labelColor} textAnchor="end" letterSpacing="0.15">
                {right}
              </text>
            </g>
          )
        })}
      </svg>

      {/* ── Center HTML content ── */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl mx-auto"
        style={{ marginTop: '-80px' }} // shift content up so curves appear below
      >
        {/* Live badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs font-semibold tracking-widest uppercase"
          style={{
            border: '1px solid rgba(120,140,180,0.25)',
            background: 'rgba(120,140,180,0.06)',
            color: 'rgba(150,170,210,0.85)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'rgba(150,170,210,0.9)' }} />
          <Zap size={11} />
          Live 24/7 Virtual Care
        </div>

        {/* Headline */}
        <h1
          className="font-bold text-white tracking-tight leading-[1.1] mb-1"
          style={{ fontSize: 'clamp(34px, 4.6vw, 58px)' }}
        >
          Virtual Healthcare,
        </h1>
        <h1
          className="font-bold tracking-tight leading-[1.1] mb-5"
          style={{ fontSize: 'clamp(34px, 4.6vw, 58px)' }}
        >
          <span style={{ color: '#2dd4bf' }}>Made </span>
          <span style={{ color: '#f59e0b' }}>Simple</span>
        </h1>

        {/* Subtitle */}
        <p
          className="leading-relaxed mb-9 max-w-[400px]"
          style={{ color: 'rgba(160,170,190,0.7)', fontSize: '0.95rem' }}
        >
          Book video consultations with specialists, receive automated calendar invites,
          and join securely via Google Meet.
        </p>

        {/* CTA */}
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2.5 font-semibold rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: '#ffffff',
            color: '#0a0a0a',
            fontSize: '0.92rem',
            padding: '13px 28px',
            boxShadow: '0 4px 24px rgba(255,255,255,0.1)',
          }}
        >
          <Video size={16} />
          Book Video Consultation
        </button>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
          {[
            { icon: CalendarCheck, label: 'Auto Calendar Invite' },
            { icon: Link2, label: 'Google Meet Link' },
            { icon: Shield, label: 'Secure & Private' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-sm"
              style={{ color: 'rgba(140,155,180,0.6)' }}>
              <Icon size={13} style={{ color: 'rgba(100,130,200,0.7)' }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
