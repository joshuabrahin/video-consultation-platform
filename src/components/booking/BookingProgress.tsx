import { cn } from '../../lib/utils'
import { BookingStep } from '../../types'

const STEPS: { key: BookingStep; label: string }[] = [
  { key: 'doctors', label: 'Doctor selection' },
  { key: 'slots', label: 'Slot selection' },
  { key: 'details', label: 'Patient details' },
  { key: 'confirmation', label: 'Calendar invite + Meet link' },
]

interface BookingProgressProps {
  currentStep: BookingStep
}

export function BookingProgress({ currentStep }: BookingProgressProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)

  return (
    <div className="px-6 pt-5 pb-4 border-b border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 rounded-full border-2 border-teal-500 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
        </div>
        <span className="text-xs font-semibold text-gray-500">Booking workflow</span>
        <div className="flex items-center gap-2 ml-2">
          {STEPS.map((step, i) => (
            <span
              key={step.key}
              className={cn(
                'text-xs transition-colors',
                i <= currentIndex ? 'text-gray-800 font-medium' : 'text-gray-400'
              )}
            >
              {i > 0 && <span className="mr-2 text-gray-300">·</span>}
              {step.label}
            </span>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5">
        {STEPS.map((step, i) => (
          <div
            key={step.key}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-500',
              i === 0 && 'bg-teal-500',
              i === 1 && i <= currentIndex && 'bg-teal-500',
              i === 1 && i > currentIndex && 'bg-gray-200',
              i === 2 && i <= currentIndex && 'bg-teal-500',
              i === 2 && i > currentIndex && 'bg-gray-200',
              i === 3 && i <= currentIndex && 'bg-teal-500',
              i === 3 && i > currentIndex && 'bg-gray-200',
            )}
          />
        ))}
      </div>
    </div>
  )
}
