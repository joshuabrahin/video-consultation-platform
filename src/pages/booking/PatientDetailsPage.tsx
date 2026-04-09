import { useState, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronLeft, User, Mail, Phone, FileText, AlertCircle, Paperclip, X, Calendar, Clock } from 'lucide-react'
import { useBookingStore } from '../../store/bookingStore'
import { Input, Textarea } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'

export function PatientDetailsPage() {
  const { selectedDoctor, selectedSlot, setStep, setPatientDetails, prescriptionFile, setPrescriptionFile } =
    useBookingStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ name: '', email: '', phone: '', problem: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!selectedDoctor || !selectedSlot) return null

  const dateLabel = (() => {
    try { return format(parseISO(selectedSlot.date), 'EEEE, MMMM d, yyyy') }
    catch { return selectedSlot.date }
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
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setPatientDetails({ ...form, prescription: prescriptionFile })
    setStep('confirmation')
  }

  return (
    <div>
      <button
        onClick={() => setStep('slots')}
        className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm mb-6 transition-colors cursor-pointer"
      >
        <ChevronLeft size={16} /> Back to slots
      </button>

      <div className="flex gap-8 items-start">
        {/* Left: form */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Patient Details</h1>
          <p className="text-gray-500 mb-8">
            We will create the calendar booking, generate a Google Meet link, and include both doctor and patient in the invite.
          </p>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Patient Name" placeholder="John Doe" icon={<User size={14} />}
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
              <Input label="Patient Email" placeholder="john@example.com" type="email" icon={<Mail size={14} />}
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value })
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
                }}
                onBlur={() => {
                  if (form.email && !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(form.email))
                    setErrors((prev) => ({ ...prev, email: 'Enter a valid email address (e.g. john@example.com)' }))
                }}
                error={errors.email} />
            </div>
            <Input label="Phone Number" placeholder="+94 77 123 4567" type="tel" icon={<Phone size={14} />}
              value={form.phone}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9+\s\-().]/g, '')
                setForm({ ...form, phone: cleaned })
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }))
              }}
              onKeyDown={(e) => {
                const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End']
                if (!allowed.includes(e.key) && !/^[0-9+\s\-().]$/.test(e.key)) e.preventDefault()
              }}
              error={errors.phone} />
            <div>
              <Textarea label="Problem / Symptoms" placeholder="Describe your symptoms or the reason for consultation..."
                value={form.problem}
                onChange={(e) => {
                  setForm({ ...form, problem: e.target.value })
                  if (errors.problem) setErrors((prev) => ({ ...prev, problem: '' }))
                }}
                error={errors.problem} />
              <p className={`text-xs mt-1 text-right ${form.problem.trim().length < 10 && form.problem.length > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {form.problem.trim().length} / 10 min characters
              </p>
            </div>

            {/* File upload */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Prescription / Reports <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden"
                onChange={(e) => setPrescriptionFile(e.target.files?.[0] || null)} />
              {prescriptionFile ? (
                <div className="flex items-center gap-2 px-4 py-3 border border-teal-200 bg-teal-50 rounded-xl">
                  <FileText size={16} className="text-teal-600" />
                  <span className="text-sm text-teal-700 flex-1 truncate">{prescriptionFile.name}</span>
                  <button onClick={() => setPrescriptionFile(null)} className="text-teal-400 hover:text-teal-600 cursor-pointer"><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-teal-300 hover:text-teal-500 transition-all text-sm cursor-pointer">
                  <Paperclip size={16} /> Attach prescription or reports
                </button>
              )}
            </div>

            <div className="flex gap-2 p-3 bg-blue-50 rounded-xl">
              <AlertCircle size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-600">
                A Google Calendar invite will be sent to both you and {selectedDoctor.name} with the Meet link included.
              </p>
            </div>

            <button onClick={handleSubmit}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl text-sm transition-colors cursor-pointer shadow-md shadow-teal-500/20">
              Confirm Booking & Generate Meet Link
            </button>
          </div>
        </div>

        {/* Right: booking summary */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-28">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Booking Summary</p>

            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
              <Avatar initials={selectedDoctor.avatar} size="sm" />
              <div>
                <p className="font-bold text-gray-900 text-sm">{selectedDoctor.name}</p>
                <p className="text-teal-600 text-xs font-semibold">{selectedDoctor.specialty}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-xs">Date</p>
                  <p className="font-semibold text-gray-800">{dateLabel}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-xs">Time</p>
                  <p className="font-semibold text-gray-800">{selectedSlot.startTime} – {selectedSlot.endTime}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 flex justify-between">
                <span className="text-gray-400">Duration</span>
                <span className="font-bold text-gray-800">30 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
