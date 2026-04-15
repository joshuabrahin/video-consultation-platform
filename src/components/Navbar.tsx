import { Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/Button'

export function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-black/30 border-b border-white/10">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
          <Activity size={16} className="text-teal-400" />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">The Right Hand</div>
          <div className="text-white/40 text-xs leading-tight">Virtual Clinic</div>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {['Find a Doctor', 'How to Book', 'Specialties', 'Support'].map((item) => (
          <a key={item} href="#" className="text-white/70 hover:text-white text-sm transition-colors">
            {item}
          </a>
        ))}
      </div>

      <Button onClick={() => navigate('/book')} size="md">
        Book Consultation
      </Button>
    </nav>
  )
}
