import Link from 'next/link'
import { BookOpen, Clock, BarChart3, Shield, Users, CheckCircle, Star, ArrowRight, Zap } from 'lucide-react'
import { PRICING_PLANS } from '@/types'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── NAV ───────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Medical<span className="text-brand-700">Gateway</span></span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            <Link href="#features" className="hover:text-brand-700 transition-colors">Features</Link>
            <Link href="#subjects" className="hover:text-brand-700 transition-colors">Subjects</Link>
            <Link href="#pricing" className="hover:text-brand-700 transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-secondary py-2 text-sm">Log in</Link>
            <Link href="/auth/register" className="btn-primary py-2 text-sm">Start Free</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white pb-24 pt-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            <Zap className="h-3.5 w-3.5" />
            Pakistan&apos;s most comprehensive MBBS MCQ platform
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight text-gray-900 md:text-6xl">
            Ace Your MBBS Exams<br />
            <span className="text-brand-700">with 25,000+ MCQs</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 leading-relaxed">
            From 1st Year to Final Year — every subject, every topic, with detailed explanations.
            Built specifically for Pakistani MBBS students.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/register" className="btn-primary px-8 py-3 text-base">
              Try 50 MCQs Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#pricing" className="btn-secondary px-8 py-3 text-base">
              See Pricing
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-success" /> No credit card for free trial</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-success" /> Cancel anytime</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-success" /> Works on mobile</span>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-16 max-w-4xl px-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { value: '25,000+', label: 'Total MCQs' },
              { value: '22',      label: 'Subjects' },
              { value: '5',       label: 'MBBS Years' },
              { value: '100%',    label: 'With Explanations' },
            ].map(({ value, label }) => (
              <div key={label} className="card p-5 text-center">
                <div className="text-3xl font-bold text-brand-700">{value}</div>
                <div className="mt-1 text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to succeed</h2>
            <p className="mt-3 text-gray-500">Designed around how MBBS students actually study</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: BookOpen, title: 'Subject-wise practice', desc: 'Filter by year and subject. Practice exactly what you need — Anatomy, Physiology, Pathology, Surgery and 18 more.' },
              { icon: Clock,    title: 'Timed mock exams',      desc: 'Replicate the real exam pressure. Set your question count and time limit. Full mock exams for final exam prep.' },
              { icon: BarChart3,title: 'Performance analytics', desc: 'See your weak subjects at a glance. Track your improvement over time with detailed score history.' },
              { icon: CheckCircle, title: 'Detailed explanations', desc: 'Every MCQ comes with a thorough explanation. Understand why the correct answer is correct — not just what it is.' },
              { icon: Shield,   title: 'Expert-verified MCQs',  desc: 'All 25,000 MCQs are reviewed for accuracy. Questions aligned with CPSP and PMDC exam standards.' },
              { icon: Users,    title: 'For all MBBS years',    desc: '1st Year to Final Year, all in one platform. Add or switch your year anytime from your dashboard.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 transition-shadow hover:shadow-card-hover">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                  <Icon className="h-5 w-5 text-brand-700" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUBJECTS ──────────────────────────────────── */}
      <section id="subjects" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-gray-900">All MBBS subjects covered</h2>
            <p className="mt-3 text-gray-500">From atoms to surgery — every topic in your curriculum</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {[
              { year: '1st Year', subjects: ['Gross Anatomy', 'Neuroanatomy', 'Histology', 'Embryology', 'Physiology', 'Biochemistry'] },
              { year: '2nd Year', subjects: ['Physiology', 'Pharmacology', 'Microbiology', 'Immunology', 'Pathology'] },
              { year: '3rd Year', subjects: ['Forensic Medicine', 'Community Medicine'] },
              { year: 'Final Year', subjects: ['Ophthalmology', 'ENT', 'Pediatrics', 'Medicine', 'Gynecology', 'Obstetrics', 'Surgery', 'Medical Oncology'] },
            ].flatMap(({ year, subjects }) =>
              subjects.map(s => ({ subject: s, year }))
            ).map(({ subject, year }) => (
              <div key={subject} className="card flex items-center justify-between p-3.5">
                <span className="text-sm font-medium text-gray-800">{subject}</span>
                <span className="badge-blue ml-2 shrink-0 text-xs">{year.replace(' Year', 'Y').replace('Final', 'Fin')}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────── */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Simple, affordable pricing</h2>
            <p className="mt-3 text-gray-500">Less than a textbook. More effective than tuition.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {PRICING_PLANS.map((plan) => (
              <div key={plan.id} className={`card p-8 relative ${plan.is_popular ? 'ring-2 ring-brand-700' : ''}`}>
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 rounded-full bg-brand-700 px-4 py-1 text-xs font-semibold text-white">
                      <Star className="h-3 w-3" /> Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-2 text-lg font-bold text-gray-900">{plan.name}</div>
                <div className="mb-1 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-brand-700">PKR {plan.price_pkr.toLocaleString()}</span>
                  <span className="text-gray-500">/year</span>
                </div>
                <div className="mb-6 text-sm text-gray-500">
                  = PKR {Math.round(plan.price_pkr / 12).toLocaleString()}/month
                </div>
                <p className="mb-6 text-sm text-gray-600">{plan.description}</p>
                <ul className="mb-8 space-y-2.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className={plan.is_popular ? 'btn-primary w-full justify-center' : 'btn-secondary w-full justify-center'}>
                  Get started
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            Start with <strong>50 free MCQs</strong> — no payment required. Upgrade anytime.
          </p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700">
                <BookOpen className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-gray-900">Medical<span className="text-brand-700">Gateway</span></span>
            </div>
            <p className="text-sm text-gray-500">© 2026 MedicalGateway. Built for Pakistani MBBS students.</p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-brand-700">Privacy</Link>
              <Link href="/terms" className="hover:text-brand-700">Terms</Link>
              <Link href="mailto:support@medicalgateway.pk" className="hover:text-brand-700">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
