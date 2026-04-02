import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Clock, Zap, Lock, ChevronRight } from 'lucide-react'

export default async function QuestionBankPage({ searchParams }: { searchParams: any }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles').select('subscription_status, role, free_mcqs_used').eq('id', user.id).single()

  const isSubscribed = profile?.subscription_status === 'active' || profile?.role === 'admin' || profile?.role === 'super_admin'
  const selectedYear = searchParams.year || ''

  const { data: subjects } = await supabase
    .from('subjects').select('*').eq('category', 'MBBS').eq('active', true).order('display_order')

  // Get MCQ counts per subject
  const { data: counts } = await supabase.rpc('get_subject_counts')
  const countMap: Record<string, number> = {}
  counts?.forEach((c: any) => { countMap[c.subject_id] = Number(c.count) })

  const years = ['1st Year', '2nd Year', '3rd Year', 'Final Year']
  const filtered = selectedYear ? subjects?.filter(s => s.year === selectedYear) : subjects

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">Medical<span className="text-brand-700">Gateway</span></span>
          </Link>
          {!isSubscribed && (
            <Link href="/pricing" className="btn-primary py-2 text-sm">Upgrade — PKR 4,800/yr</Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
            <p className="mt-1 text-gray-500">
              {subjects?.reduce((a, s) => a + (countMap[s.id] || 0), 0).toLocaleString()} MCQs across {subjects?.length} subjects
            </p>
          </div>
        </div>

        {/* Year filter tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Link href="/question-bank"
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition
              ${!selectedYear ? 'border-brand-700 bg-brand-700 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-brand-300'}`}>
            All Years
          </Link>
          {years.map(y => (
            <Link key={y} href={`/question-bank?year=${encodeURIComponent(y)}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition
                ${selectedYear === y ? 'border-brand-700 bg-brand-700 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-brand-300'}`}>
              {y}
            </Link>
          ))}
        </div>

        {/* Subject cards */}
        {(selectedYear ? [selectedYear] : years).map(year => {
          const yearSubjects = filtered?.filter(s => s.year === year) || []
          if (!yearSubjects.length) return null
          return (
            <div key={year} className="mb-8">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="font-semibold text-gray-700">{year}</h2>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {yearSubjects.map(subject => {
                  const mcqCount = countMap[subject.id] || 0
                  const locked   = !isSubscribed

                  return (
                    <div key={subject.id} className={`card group overflow-hidden transition-shadow hover:shadow-card-hover ${locked ? 'opacity-80' : ''}`}>
                      <div className="p-5">
                        <div className="mb-3 flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                          {locked
                            ? <Lock className="h-4 w-4 text-gray-300 shrink-0" />
                            : <span className="badge-blue text-xs">{subject.code}</span>
                          }
                        </div>
                        <p className="mb-4 text-sm text-gray-500">
                          {mcqCount > 0 ? `${mcqCount.toLocaleString()} MCQs available` : 'Coming soon'}
                        </p>

                        {locked ? (
                          <Link href="/pricing" className="btn-secondary w-full justify-center py-2 text-sm">
                            <Lock className="h-3.5 w-3.5" /> Unlock — PKR 4,800/yr
                          </Link>
                        ) : (
                          <div className="flex gap-2">
                            <Link href={`/exam?mode=practice&subject=${subject.id}`}
                              className="btn-secondary flex-1 justify-center gap-1.5 py-2 text-xs">
                              <Zap className="h-3.5 w-3.5" /> Practice
                            </Link>
                            <Link href={`/exam?mode=timed&subject=${subject.id}`}
                              className="btn-primary flex-1 justify-center gap-1.5 py-2 text-xs">
                              <Clock className="h-3.5 w-3.5" /> Timed
                            </Link>
                          </div>
                        )}
                      </div>
                      {!locked && mcqCount > 0 && (
                        <Link href={`/exam?mode=mock&subject=${subject.id}`}
                          className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-5 py-2.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                          <span>Full mock exam (all {mcqCount} MCQs)</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {!isSubscribed && (
          <div className="card border-brand-100 bg-brand-50 p-6 text-center mt-6">
            <h3 className="mb-2 font-semibold text-brand-800">Unlock all 22 subjects</h3>
            <p className="mb-4 text-sm text-brand-600">Get full access to all 25,000+ MCQs for just PKR 4,800/year</p>
            <Link href="/pricing" className="btn-primary mx-auto">
              Subscribe now — PKR 400/month
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
