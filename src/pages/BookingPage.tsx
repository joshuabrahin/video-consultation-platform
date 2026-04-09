import { useNavigate } from 'react-router-dom'
import { Activity, ArrowLeft } from 'lucide-react'
import { useBookingStore } from '../store/bookingStore'
import { DoctorSelectionPage } from './booking/DoctorSelectionPage'
import { SlotSelectionPage } from './booking/SlotSelectionPage'
import { PatientDetailsPage } from './booking/PatientDetailsPage'
import { ConfirmationPage } from './booking/ConfirmationPage'

const STEPS = [
  { key: 'doctors',      label: 'Doctor selection' },
  { key: 'slots',        label: 'Slot selection' },
  { key: 'details',      label: 'Patient details' },
  { key: 'confirmation', label: 'Calendar invite + Meet link' },
]

export function BookingPage() {
  const navigate = useNavigate()
  const { currentStep, reset } = useBookingStore()

  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)

  const handleBack = () => {
    reset()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top navigation bar ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer mr-6"
            onClick={handleBack}
          >
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
              <Activity size={16} className="text-teal-600" />
            </div>
            <div>
              <div className="text-gray-900 font-bold text-sm leading-tight">The Right Hand</div>
              <div className="text-gray-400 text-xs leading-tight">Virtual Clinic</div>
            </div>
          </div>

          {/* Step breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-4 h-4 rounded-full border-2 border-teal-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            </div>
            <span className="text-gray-500 font-medium mr-1">Booking workflow</span>
            {STEPS.map((step, i) => (
              <span key={step.key} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-gray-300">·</span>}
                <span className={i <= currentIndex ? 'text-gray-800 font-semibold' : 'text-gray-400'}>
                  {step.label}
                </span>
              </span>
            ))}
          </div>

          {/* Back button */}
          <button
            onClick={handleBack}
            className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            Back to Home
          </button>
        </div>

        {/* Progress bar */}
        {currentStep !== 'confirmation' && (
          <div className="max-w-6xl mx-auto px-6 pb-3">
            <div className="flex gap-2">
              {STEPS.filter(s => s.key !== 'confirmation').map((step, i) => {
                const idx = STEPS.findIndex(s2 => s2.key === step.key)
                return (
                  <div
                    key={step.key}
                    className="h-1.5 flex-1 rounded-full transition-all duration-500"
                    style={{
                      background: idx <= currentIndex ? '#14b8a6' : '#e5e7eb'
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {currentStep === 'doctors'      && <DoctorSelectionPage />}
        {currentStep === 'slots'        && <SlotSelectionPage />}
        {currentStep === 'details'      && <PatientDetailsPage />}
        {currentStep === 'confirmation' && <ConfirmationPage />}
      </main>
    </div>
  )
}
