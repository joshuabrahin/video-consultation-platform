import { useState } from 'react'
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { Activity, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'
import { apiPost } from '../lib/api'
import { useAuthStore } from '../store/authStore'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface LoginResponse {
  access_token: string
}

interface RegisterResponse {
  message: string
  userId: number
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthPage
// ─────────────────────────────────────────────────────────────────────────────

export function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, token } = useAuthStore()

  // Already signed in — send them on their way
  const redirectTo = searchParams.get('next') ?? '/'
  if (token) return <Navigate to={redirectTo} replace />

  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await apiPost<LoginResponse>('/auth/login', { email, password })

      // Decode the JWT payload to get user info (no library needed)
      const payload = JSON.parse(atob(data.access_token.split('.')[1])) as {
        sub: number
        email: string
        name?: string
      }

      login(data.access_token, {
        id: payload.sub,
        email: payload.email,
        name: payload.name ?? email.split('@')[0],
      })

      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await apiPost<RegisterResponse>('/auth/register', { name, email, password })
      setSuccess('Account created! Please sign in.')
      setTab('login')
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputBase =
    'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-teal-500/60 focus:bg-white/8 transition-colors'

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1a2e 50%, #0a1428 100%)' }}
    >
      {/* Card */}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div
          className="flex items-center gap-2 mb-8 cursor-pointer justify-center"
          onClick={() => navigate('/')}
        >
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
            <Activity size={18} className="text-teal-400" />
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight">The Right Hand</div>
            <div className="text-white/40 text-xs leading-tight">Virtual Clinic</div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-7">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setSuccess(null) }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  tab === t
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Success banner */}
          {success && (
            <div className="mb-5 px-4 py-3 bg-teal-500/15 border border-teal-500/30 rounded-xl text-teal-300 text-sm">
              {success}
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Login form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputBase} pl-10`}
                />
              </div>

              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputBase} pl-10 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-colors cursor-pointer"
              >
                {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : 'Sign In'}
              </button>

              <p className="text-center text-white/40 text-xs mt-1">
                No account?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('register'); setError(null) }}
                  className="text-teal-400 hover:text-teal-300 cursor-pointer"
                >
                  Create one free
                </button>
              </p>
            </form>
          )}

          {/* Register form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Full name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${inputBase} pl-10`}
                />
              </div>

              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputBase} pl-10`}
                />
              </div>

              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min 8 characters)"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputBase} pl-10 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-colors cursor-pointer"
              >
                {loading ? <><Loader2 size={15} className="animate-spin" /> Creating account…</> : 'Create Account'}
              </button>

              <p className="text-center text-white/40 text-xs mt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('login'); setError(null) }}
                  className="text-teal-400 hover:text-teal-300 cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Your data is encrypted and stored securely.
        </p>
      </div>
    </div>
  )
}
