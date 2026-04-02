import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Clock, BarChart3, Flame, ArrowRight, Lock, Trophy } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles').select('*').eq('id', user.id).single()

  const { data: streak } = await supabase
    .from('user_streaks').select('*').eq('user_id', user.id).single()

  const { data: recentSessions } = await supabase
    .from('exam_sessions')
    .select('*, subjects(name)')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(5)

  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .eq('category', 'MBBS')
    .eq('active', true)
    .order('display_order')

  const isSubscribed = profile?.subscription_status === 'active'
  const firstName = profile?.full_name?.split(' ')[0] || 'Student'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Medical<span className="text-brand-700">Gateway</span></span>
          </Link>
          <div className="flex items-center gap-3">
            {!isSubscribed && (
              <Link href="/pricing" className="btn-primary py-2 text-sm">
                Upgrade — PKR 4,800/yr
              </Link>
            )}
            <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
              {firstName[0]}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Good day, {firstName} 👋</h1>
          <p className="mt-1 text-gray-500">
            {profile?.mbbs_year ? `${profile.mbbs_year} · ` : ''}
            {isSubscribed ? 'Full access active' : `Free trial — ${50 - (profile?.free_mcqs_used || 0)} MCQs remaining`}
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: Flame,   label: 'Day streak',    value: streak?.current_streak || 0, color: 'text-orange-500' },
            { icon: Trophy,  label: 'Best streak',   value: streak?.longest_streak || 0, color: 'text-yellow-500' },
            { icon: BookOpen,label: 'Total MCQs done', value: recentSessions?.reduce((a, s) => a + (s.total_questions || 0), 0) || 0, color: 'text-brand-700' },
            { icon: BarChart3,label: 'Avg score',    value: recentSessions?.length ? Math.round(recentSessions.reduce((a, s) => a + (s.score || 0), 0) / recentSessions.length) + '%' : '—', color: 'text-success' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card p-5">
              <Icon className={`mb-2 h-5 w-5 ${color}`} />
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Link href="/question-bank" className="card group p-6 transition-shadow hover:shadow-card-hover">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 group-hover:bg-brand-100 transition-colors">
              <BookOpen className="h-6 w-6 text-brand-700" />
            </div>
            <h3 className="font-semibold text-gray-900">Question Bank</h3>
            <p className="mt-1 text-sm text-gray-500">Browse and practice by subject</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand-700">
              Start practicing <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link href="/exam?mode=timed" className="card group p-6 transition-shadow hover:shadow-card-hover">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 group-hover:bg-orange-100 transition-colors">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Timed Exam</h3>
            <p className="mt-1 text-sm text-gray-500">Simulate real exam conditions</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-orange-600">
              Start exam <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link href="/results" className="card group p-6 transition-shadow hover:shadow-card-hover">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-success-light group-hover:bg-green-100 transition-colors">
              <BarChart3 className="h-6 w-6 text-success" />
            </div>
            <h3 className="font-semibold text-gray-900">My Performance</h3>
            <p className="mt-1 text-sm text-gray-500">Track scores and weak areas</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-success">
              View analytics <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>

        {/* Subjects grid */}
        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">All subjects</h2>
            <Link href="/question-bank" className="text-sm text-brand-700 hover:underline">Browse all →</Link>
          </div>

          {['1st Year', '2nd Year', '3rd Year', 'Final Year'].map(year => {
            const yearSubjects = subjects?.filter(s => s.year === year) || []
            return (
              <div key={year} className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{year}</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                  {yearSubjects.map(subject => (
                    <Link
                      key={subject.id}
                      href={isSubscribed ? `/question-bank?subject=${subject.id}` : '/pricing'}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm font-medium text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                    >
                      <span className="truncate">{subject.name}</span>
                      {!isSubscribed && <Lock className="ml-2 h-3 w-3 shrink-0 text-gray-300" />}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent activity */}
        {recentSessions && recentSessions.length > 0 && (
          <div className="mt-6 card p-6">
            <h2 className="mb-4 font-semibold text-gray-900">Recent sessions</h2>
            <div className="space-y-3">
              {recentSessions.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{(s as any).subjects?.name || 'Mixed'}</div>
                    <div className="text-xs text-gray-500">{s.total_questions} questions · {s.mode}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${(s.score || 0) >= 70 ? 'text-success' : (s.score || 0) >= 50 ? 'text-warning' : 'text-danger'}`}>
                      {Math.round(s.score || 0)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(s.completed_at!).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
