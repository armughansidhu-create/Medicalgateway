import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CheckCircle, XCircle, SkipForward, BarChart3, RotateCcw, Home, Trophy } from 'lucide-react'

export default async function ResultsPage({ searchParams }: { searchParams: any }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const sessionId = searchParams.session
  const score     = parseInt(searchParams.score || '0')
  const correct   = parseInt(searchParams.correct || '0')
  const total     = parseInt(searchParams.total || '0')

  // Load full session with attempts
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('*, subjects(name)')
    .eq('id', sessionId)
    .single()

  const { data: attempts } = await supabase
    .from('mcq_attempts')
    .select('*, mcqs(question, option_a, option_b, option_c, option_d, option_e, correct_answer, explanation, topic)')
    .eq('session_id', sessionId)
    .order('created_at')

  const incorrect = attempts?.filter(a => !a.is_correct && !a.is_skipped) || []
  const skipped   = attempts?.filter(a => a.is_skipped) || []

  const grade =
    score >= 80 ? { label: 'Excellent', color: 'text-success',  bg: 'bg-success-light'  } :
    score >= 65 ? { label: 'Good',      color: 'text-brand-700', bg: 'bg-brand-50'       } :
    score >= 50 ? { label: 'Fair',      color: 'text-warning',   bg: 'bg-warning-light'  } :
                  { label: 'Needs work',color: 'text-danger',    bg: 'bg-danger-light'   }

  const subjectName = (session as any)?.subjects?.name || 'Mixed'

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            <Home className="h-4 w-4" /> Dashboard
          </Link>
          <Link href="/results/history" className="text-sm text-brand-700 hover:underline">
            View all results →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">

        {/* Score card */}
        <div className="card mb-6 overflow-hidden">
          <div className={`${grade.bg} px-6 py-8 text-center`}>
            <Trophy className={`mx-auto mb-3 h-10 w-10 ${grade.color}`} />
            <div className={`text-6xl font-bold ${grade.color}`}>{score}%</div>
            <div className={`mt-1 text-lg font-semibold ${grade.color}`}>{grade.label}</div>
            <div className="mt-2 text-sm text-gray-500">{subjectName} · {session?.mode} exam</div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-100 p-4">
            <div className="px-4 py-2 text-center">
              <div className="flex items-center justify-center gap-1.5 text-success">
                <CheckCircle className="h-4 w-4" />
                <span className="text-2xl font-bold">{correct}</span>
              </div>
              <div className="text-xs text-gray-400">Correct</div>
            </div>
            <div className="px-4 py-2 text-center">
              <div className="flex items-center justify-center gap-1.5 text-danger">
                <XCircle className="h-4 w-4" />
                <span className="text-2xl font-bold">{total - correct - skipped.length}</span>
              </div>
              <div className="text-xs text-gray-400">Incorrect</div>
            </div>
            <div className="px-4 py-2 text-center">
              <div className="flex items-center justify-center gap-1.5 text-warning">
                <SkipForward className="h-4 w-4" />
                <span className="text-2xl font-bold">{skipped.length}</span>
              </div>
              <div className="text-xs text-gray-400">Skipped</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Link href={`/exam?mode=${session?.mode}&subject=${session?.subject_id || ''}`}
            className="btn-primary gap-2">
            <RotateCcw className="h-4 w-4" /> Retry this exam
          </Link>
          <Link href="/question-bank" className="btn-secondary gap-2">
            <BarChart3 className="h-4 w-4" /> Practice more
          </Link>
          <Link href="/dashboard" className="btn-secondary gap-2">
            <Home className="h-4 w-4" /> Dashboard
          </Link>
        </div>

        {/* Incorrect answers review */}
        {incorrect.length > 0 && (
          <div className="card p-5 mb-5">
            <h2 className="mb-4 font-semibold text-gray-900 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-danger" />
              Review incorrect answers ({incorrect.length})
            </h2>
            <div className="space-y-5">
              {incorrect.map((attempt, i) => {
                const mcq = (attempt as any).mcqs
                if (!mcq) return null
                const opts: [string, string][] = [
                  ['A', mcq.option_a], ['B', mcq.option_b],
                  ['C', mcq.option_c], ['D', mcq.option_d],
                  ...(mcq.option_e ? [['E', mcq.option_e] as [string, string]] : [])
                ]
                return (
                  <div key={attempt.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-1 text-xs text-gray-400">Q{i + 1} · {mcq.topic}</div>
                    <p className="mb-3 text-sm font-medium text-gray-900">{mcq.question}</p>
                    <div className="space-y-1.5">
                      {opts.map(([letter, text]) => {
                        const isCorrect  = mcq.correct_answer === letter
                        const isSelected = attempt.selected_answer === letter
                        return (
                          <div key={letter} className={`flex items-start gap-2.5 rounded-lg p-2.5 text-sm
                            ${isCorrect  ? 'bg-success-light'
                            : isSelected ? 'bg-danger-light'
                            : 'bg-white'}`}>
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold
                              ${isCorrect ? 'bg-success text-white' : isSelected ? 'bg-danger text-white' : 'bg-gray-100 text-gray-500'}`}>
                              {letter}
                            </span>
                            <span className={isCorrect ? 'text-success-dark font-medium' : isSelected ? 'text-danger font-medium' : 'text-gray-600'}>
                              {text}
                            </span>
                            {isCorrect  && <CheckCircle className="ml-auto mt-0.5 h-3.5 w-3.5 text-success shrink-0" />}
                            {isSelected && !isCorrect && <XCircle className="ml-auto mt-0.5 h-3.5 w-3.5 text-danger shrink-0" />}
                          </div>
                        )
                      })}
                    </div>
                    {mcq.explanation && (
                      <div className="mt-3 rounded-lg bg-brand-50 p-3 text-xs leading-relaxed text-brand-800 border border-brand-100">
                        <strong>Explanation:</strong> {mcq.explanation}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Skipped */}
        {skipped.length > 0 && (
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-gray-900 flex items-center gap-2">
              <SkipForward className="h-4 w-4 text-warning" />
              Skipped questions ({skipped.length})
            </h2>
            <div className="space-y-2">
              {skipped.map((attempt, i) => {
                const mcq = (attempt as any).mcqs
                if (!mcq) return null
                return (
                  <div key={attempt.id} className="rounded-lg bg-warning-light border border-yellow-100 p-3">
                    <p className="text-sm text-gray-700">{mcq.question}</p>
                    <p className="mt-1 text-xs text-warning">Correct: Option {mcq.correct_answer}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
