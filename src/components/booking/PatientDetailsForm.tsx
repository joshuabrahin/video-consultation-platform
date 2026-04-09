import { useState, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronLeft, User, Mail, Phone, FileText, AlertCircle, Paperclip, X } from 'lucide-react'
import { useBookingStore } from '../../store/bookingStore'
import { Input, Textarea } from '../ui/Input'
import { Avatar } from '../ui/Avatar'

export function PatientDetailsForm() {
  const { selectedDoctor, selectedSlot, setStep, setPatientDetails, prescriptionFile, setPrescriptionFile } =
    useBookingStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    problem: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!selectedDoctor || !selectedSlot) return null

  const dateLabel = (() => {
    try {
      return format(parseISO(selectedSlot.date), 'EEEE, MMMM d')
    } catch {
      return selectedSlot.date
    }
  })()

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Patient name is required'

    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(form.email))
      errs.email = 'Enter a valid email address (e.g. john@example.com)'

    if (!form.phone.trim()) errs.phone = 'Phone number is required'
    else if (!/^\+?[\d\s\-().]{7,20}$/.test(form.phone))
      errs.phone = 'Enter a valid phone number (e.g. +94 77 123 4567)'

    if (!form.problem.trim()) errs.problem = 'Please describe the problem or symptoms'
    else if (form.problem.trim().length < 10)
      errs.problem = 'Please provide at least 10 characters'

    return errs
  }

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setPatientDetails({ ...form, prescription: prescriptionFile })
    setStep('confirmation')
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setPrescriptionFile(file)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-3">
        <button
          onClick={() => setStep('slots')}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-3 transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          Back to slots
        </button>
        <h2 className="text-xl font-bold text-gray-900">Patient Details & Booking Confirmation</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          We will create the calendar booking, generate a Google Meet link, and include both doctor and
          patient in the invite.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
        <div className="flex gap-5">
          {/* Form */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Patient Name"
                placeholder="John Doe"
                icon={<User size={14} />}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={errors.name}
              />
              <Input
                label="Patient Email"
                placeholder="john@example.com"
                type="email"
                icon={<Mail size={14} />}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={errors.email}
              />
            </div>

            <Input
              label="Phone Number"
              placeholder="+94 77 123 4567"
              type="tel"
              icon={<Phone size={14} />}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              error={errors.phone}
            />

            <div>
              <Textarea
                label="Problem / Symptoms"
                placeholder="Describe your symptoms or the reason for consultation..."
                value={form.problem}
                onChange={(e) => {
                  setForm({ ...form, problem: e.target.value })
                  if (errors.problem) setErrors((prev) => ({ ...prev, problem: '' }))
                }}
                error={errors.problem}
              />
              <p className={`text-xs mt-1 text-right ${form.problem.trim().length < 10 && form.problem.length > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {form.problem.trim().length} / 10 min characters
              </p>
            </div>

            {/* File upload */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Prescription / Reports{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={handleFile}
              />
              {prescriptionFile ? (
                <div className="flex items-center gap-2 px-4 py-3 border border-teal-200 bg-teal-50 rounded-xl">
                  <FileText size={16} className="text-teal-600" />
                  <span className="text-sm text-teal-700 flex-1 truncate">{prescriptionFile.name}</span>
                  <button
                    onClick={() => setPrescriptionFile(null)}
                    className="text-teal-400 hover:text-teal-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-teal-300 hover:text-teal-500 transition-all text-sm cursor-pointer"
                >
                  <Paperclip size={16} />
                  Attach prescription or reports
                </button>
              )}
            </div>

            {/* Info note */}
            <div className="flex gap-2 p-3 bg-blue-50 rounded-xl">
              <AlertCircle size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-600">
                A Google Calendar invite will be sent to both you and {selectedDoctor.name} with the
                Meet link. Check your spam folder if you don't receive it.
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl text-sm transition-colors cursor-pointer shadow-md shadow-teal-500/25"
            >
              Confirm Booking & Generate Meet Link
            </button>
          </div>

          {/* Summary sidebar */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-gray-50 rounded-2xl p-4 sticky top-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Booking Summary
              </p>
              <div className="space-y-3">
                <div className="pb-3 border-b border-gray-200">
                  <p className="text-xs text-gray-400 mb-1">Doctor</p>
                  <div className="flex items-center gap-2">
                    <Avatar initials={selectedDoctor.avatar} size="sm" />
                    <div>
                      <p className="font-bold text-gray-800 text-xs leading-tight">
                        {selectedDoctor.name}
                      </p>
                      <p className="text-teal-600 text-xs">{selectedDoctor.specialty}</p>
                    </div>
                  </div>
                </div>
                <div className="pb-3 border-b border-gray-200">
                  <p className="text-xs text-gray-400 mb-1">Selected Slot</p>
                  <p className="font-bold text-gray-800 text-xs">{dateLabel}</p>
                  <p className="text-gray-500 text-xs">{selectedSlot.startTime}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Duration</p>
                  <p className="font-bold text-gray-800 text-xs">30 minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
