'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const MBBS_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Final Year']

export default function RegisterPage() {
  const router  = useRouter()
  const supabase = createClient()
  const [form, setForm]   = useState({ fullName: '', email: '', password: '', mbbsYear: '', college: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('user_profiles').update({
        full_name: form.fullName,
        medical_college: form.college,
        mbbs_year: form.mbbsYear,
      }).eq('id', data.user.id)
    }
    toast.success('Account created! Check your email to verify.')
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Medical<span className="text-brand-700">Gateway</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Start with 50 free MCQs — no card needed</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" type="text" placeholder="Dr. Ahmed Khan" required
                value={form.fullName} onChange={e => update('fullName', e.target.value)} />
            </div>
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@example.com" required
                value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">MBBS Year</label>
                <select className="input" value={form.mbbsYear} onChange={e => update('mbbsYear', e.target.value)}>
                  <option value="">Select year</option>
                  {MBBS_YEARS.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Medical College</label>
                <input className="input" type="text" placeholder="e.g. KEMU"
                  value={form.college} onChange={e => update('college', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-11" type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters" required minLength={8}
                  value={form.password} onChange={e => update('password', e.target.value)} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : 'Create free account'}
            </button>
            <p className="text-center text-xs text-gray-400">
              By signing up you agree to our{' '}
              <Link href="/terms" className="text-brand-700 hover:underline">Terms</Link> and{' '}
              <Link href="/privacy" className="text-brand-700 hover:underline">Privacy Policy</Link>
            </p>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-brand-700 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}
