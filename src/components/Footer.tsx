import { Activity } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
            <Activity size={16} className="text-teal-400" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">The Right Hand</div>
            <div className="text-white/40 text-xs">Virtual Clinic</div>
          </div>
        </div>
        <p className="text-white/40 text-sm">
          © 2026 The Right Hand. Virtual healthcare made simple.
        </p>
      </div>
    </footer>
  )
}
