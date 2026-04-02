import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, BookOpen, CreditCard, TrendingUp, Upload, UserCheck } from 'lucide-react'

export default async function AdminAnalyticsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'super_admin'].includes(profile?.role || '')) redirect('/dashboard')

  const { data: stats } = await supabase.rpc('get_admin_stats')

  const { data: recentUsers } = await supabase
    .from('user_profiles')
    .select('full_name, email, subscription_status, mbbs_year, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: subjectStats } = await supabase
    .from('subjects')
    .select('id, name, year, code')
    .eq('active', true)
    .order('display_order')

  const { data: mcqCounts } = await supabase.rpc('get_subject_counts')
  const countMap: Record<string, number> = {}
  mcqCounts?.forEach((c: any) => { countMap[c.subject_id] = Number(c.count) })
  const totalMcqs = Object.values(countMap).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">Medical<span className="text-brand-700">Gateway</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/admin/upload" className="btn-primary py-2 text-sm gap-2">
              <Upload className="h-4 w-4" /> Upload MCQs
            </Link>
            <Link href="/admin/users" className="btn-secondary py-2 text-sm">Manage Users</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-gray-500">MedicalGateway platform overview</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: Users,       label: 'Total users',         value: stats?.total_users || 0,          color: 'text-brand-700',  bg: 'bg-brand-50'  },
            { icon: UserCheck,   label: 'Active subscribers',  value: stats?.active_subscribers || 0,   color: 'text-success',    bg: 'bg-success-light' },
            { icon: BookOpen,    label: 'Total MCQs',          value: totalMcqs.toLocaleString(),        color: 'text-purple-600', bg: 'bg-purple-50' },
            { icon: TrendingUp,  label: 'New this month',      value: stats?.new_users_this_month || 0, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="card p-5">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* MCQ coverage by subject */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">MCQ coverage by subject</h2>
              <Link href="/admin/upload" className="text-sm text-brand-700 hover:underline">Upload more →</Link>
            </div>
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {subjectStats?.map(subject => {
                const count = countMap[subject.id] || 0
                const maxCount = Math.max(...Object.values(countMap), 1)
                const pct = Math.round((count / maxCount) * 100)
                return (
                  <div key={subject.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium">{subject.name}</span>
                      <span className={`font-semibold ${count > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                        {count > 0 ? count.toLocaleString() : '—'}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent users */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent sign-ups</h2>
              <Link href="/admin/users" className="text-sm text-brand-700 hover:underline">All users →</Link>
            </div>
            <div className="space-y-3">
              {recentUsers?.map(u => (
                <div key={u.email} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {u.full_name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{u.full_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">{u.mbbs_year || 'Year not set'}</div>
                    </div>
                  </div>
                  <span className={`badge text-xs ${u.subscription_status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                    {u.subscription_status === 'active' ? 'Paid' : 'Free'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue estimate */}
        <div className="mt-6 card border-success-light bg-success-light p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-success" />
                <h2 className="font-semibold text-success-dark">Revenue estimate</h2>
              </div>
              <p className="text-sm text-success-dark opacity-80">
                Based on {stats?.active_subscribers || 0} active subscribers at PKR 4,800/year average
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-success">
                PKR {((stats?.active_subscribers || 0) * 4800).toLocaleString()}
              </div>
              <div className="text-xs text-success-dark opacity-70">annual revenue</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
