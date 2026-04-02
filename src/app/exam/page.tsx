'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Clock, Flag, X, CheckCircle, XCircle, SkipForward, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { MCQ } from '@/types'

type Answer = 'A' | 'B' | 'C' | 'D' | 'E' | null

interface QuestionState {
  mcq: MCQ
  selected: Answer
  revealed: boolean
  skipped: boolean
  timeSpent: number
}

export default function ExamPage() {
  const router       = useRouter()
  const params       = useSearchParams()
  const supabase     = createClient()

  const mode      = params.get('mode') || 'practice'
  const subjectId = params.get('subject') || ''
  const sessionId = params.get('session') || ''

  const [questions, setQuestions]   = useState<QuestionState[]>([])
  const [current, setCurrent]       = useState(0)
  const [sessionDbId, setSessionDbId] = useState<string | null>(null)
  const [timeLeft, setTimeLeft]     = useState<number | null>(null)
  const [loading, setLoading]       = useState(true)
  const [finished, setFinished]     = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const startTime = useRef<number>(Date.now())
  const questionStart = useRef<number>(Date.now())

  // Load MCQs
  useEffect(() => {
    async function loadExam() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      let query = supabase.from('mcqs').select('*, subjects(name, code, year)').eq('is_active', true)
      if (subjectId) query = query.eq('subject_id', subjectId)

      const limit = mode === 'mock' ? 100 : mode === 'timed' ? 40 : 20
      const { data: mcqs, error } = await query.limit(limit)

      if (error || !mcqs?.length) {
        toast.error('No MCQs found for this selection')
        router.back()
        return
      }

      // Shuffle
      const shuffled = [...mcqs].sort(() => Math.random() - 0.5)
      setQuestions(shuffled.map(mcq => ({ mcq, selected: null, revealed: false, skipped: false, timeSpent: 0 })))

      // Create session in DB
      const timeLimitMinutes = mode === 'timed' ? limit : mode === 'mock' ? 120 : undefined
      if (timeLimitMinutes) setTimeLeft(timeLimitMinutes * 60)

      const { data: session } = await supabase.from('exam_sessions').insert({
        user_id:            user.id,
        mode,
        status:             'in_progress',
        subject_id:         subjectId || null,
        category:           'MBBS',
        total_questions:    shuffled.length,
        time_limit_minutes: timeLimitMinutes || null,
      }).select().single()

      if (session) setSessionDbId(session.id)
      setLoading(false)
      questionStart.current = Date.now()
    }
    loadExam()
  }, [])

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || finished) return
    if (timeLeft <= 0) { handleFinish(); return }
    const t = setTimeout(() => setTimeLeft(t => (t ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, finished])

  const currentQ = questions[current]

  function selectAnswer(answer: Answer) {
    if (!currentQ || currentQ.revealed) return
    setQuestions(qs => qs.map((q, i) =>
      i === current ? { ...q, selected: answer, revealed: mode === 'practice' } : q
    ))
  }

  function revealAnswer() {
    if (!currentQ || currentQ.revealed) return
    const spent = Math.round((Date.now() - questionStart.current) / 1000)
    setQuestions(qs => qs.map((q, i) =>
      i === current ? { ...q, revealed: true, timeSpent: spent } : q
    ))
  }

  function skipQuestion() {
    const spent = Math.round((Date.now() - questionStart.current) / 1000)
    setQuestions(qs => qs.map((q, i) =>
      i === current ? { ...q, skipped: true, revealed: true, timeSpent: spent } : q
    ))
    goNext()
  }

  function goNext() {
    questionStart.current = Date.now()
    if (current < questions.length - 1) setCurrent(c => c + 1)
    else handleFinish()
  }

  function goPrev() {
    if (current > 0) { setCurrent(c => c - 1); questionStart.current = Date.now() }
  }

  const handleFinish = useCallback(async () => {
    if (finished) return
    setFinished(true)

    const correct   = questions.filter(q => q.selected === q.mcq.correct_answer).length
    const incorrect = questions.filter(q => q.revealed && !q.skipped && q.selected !== q.mcq.correct_answer).length
    const skipped   = questions.filter(q => q.skipped).length
    const score     = Math.round((correct / questions.length) * 100)

    if (sessionDbId) {
      // Save session result
      await supabase.from('exam_sessions').update({
        status:          'completed',
        completed_at:    new Date().toISOString(),
        score,
        correct_count:   correct,
        incorrect_count: incorrect,
        skipped_count:   skipped,
      }).eq('id', sessionDbId)

      // Save individual attempts
      const attempts = questions.map(q => ({
        session_id:         sessionDbId,
        user_id:            '', // filled server-side via RLS
        mcq_id:             q.mcq.id,
        selected_answer:    q.selected || null,
        is_correct:         q.selected === q.mcq.correct_answer,
        is_skipped:         q.skipped,
        time_spent_seconds: q.timeSpent,
      }))
      await supabase.from('mcq_attempts').insert(attempts)
    }

    router.push(`/results?session=${sessionDbId}&score=${score}&correct=${correct}&total=${questions.length}`)
  }, [finished, questions, sessionDbId])

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-700" />
        <p className="text-gray-500">Loading questions...</p>
      </div>
    </div>
  )

  if (!currentQ) return null

  const { mcq, selected, revealed, skipped } = currentQ
  const isCorrect = selected === mcq.correct_answer
  const opts: [string, string][] = [
    ['A', mcq.option_a], ['B', mcq.option_b], ['C', mcq.option_c], ['D', mcq.option_d],
    ...(mcq.option_e ? [['E', mcq.option_e] as [string, string]] : []),
  ]

  const answered  = questions.filter(q => q.revealed).length
  const progress  = Math.round((answered / questions.length) * 100)

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowExitConfirm(true)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
            <div>
              <div className="text-sm font-semibold text-gray-800">
                {(mcq as any).subjects?.name} · {mode === 'mock' ? 'Mock Exam' : mode === 'timed' ? 'Timed Practice' : 'Practice'}
              </div>
              <div className="text-xs text-gray-400">Q {current + 1} of {questions.length}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress */}
            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-1.5 w-32 rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-gray-400">{progress}%</span>
            </div>
            {/* Timer */}
            {timeLeft !== null && (
              <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${timeLeft < 300 ? 'bg-danger-light text-danger' : 'bg-gray-100 text-gray-700'}`}>
                <Clock className="h-3.5 w-3.5" />
                {formatTime(timeLeft)}
              </div>
            )}
            <button onClick={handleFinish} className="btn-secondary py-1.5 text-xs">
              End exam
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="grid gap-5 lg:grid-cols-3">

          {/* Question + Options */}
          <div className="lg:col-span-2 space-y-4">
            {/* Question card */}
            <div className="card p-6">
              <div className="mb-2 flex items-center gap-2">
                {mcq.difficulty && (
                  <span className={`badge text-xs ${mcq.difficulty === 'Easy' ? 'badge-green' : mcq.difficulty === 'Hard' ? 'badge-red' : 'badge-amber'}`}>
                    {mcq.difficulty}
                  </span>
                )}
                {mcq.topic && <span className="text-xs text-gray-400">{mcq.topic}</span>}
              </div>
              <p className="text-base font-medium leading-relaxed text-gray-900">{mcq.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {opts.map(([letter, text]) => {
                const isSelected = selected === letter
                const isCorrectOpt = mcq.correct_answer === letter
                let style = 'border-gray-100 bg-white hover:border-brand-200 hover:bg-brand-50'
                if (revealed) {
                  if (isCorrectOpt) style = 'border-success bg-success-light'
                  else if (isSelected && !isCorrectOpt) style = 'border-danger bg-danger-light'
                  else style = 'border-gray-100 bg-gray-50 opacity-60'
                } else if (isSelected) {
                  style = 'border-brand-500 bg-brand-50'
                }

                return (
                  <button key={letter} onClick={() => selectAnswer(letter as Answer)} disabled={revealed}
                    className={`option-enter w-full rounded-xl border p-4 text-left transition-all ${style}`}>
                    <div className="flex items-start gap-3">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold
                        ${revealed && isCorrectOpt ? 'bg-success text-white'
                          : revealed && isSelected && !isCorrectOpt ? 'bg-danger text-white'
                          : isSelected ? 'bg-brand-700 text-white'
                          : 'bg-gray-100 text-gray-600'}`}>
                        {letter}
                      </span>
                      <span className="text-sm leading-relaxed text-gray-800">{text}</span>
                      {revealed && isCorrectOpt && <CheckCircle className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-success" />}
                      {revealed && isSelected && !isCorrectOpt && <XCircle className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-danger" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            {revealed && mcq.explanation && (
              <div className="card border-brand-100 bg-brand-50 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-brand-700" />
                  <span className="text-sm font-semibold text-brand-700">Explanation</span>
                  {!skipped && (
                    <span className={`ml-auto badge ${isCorrect ? 'badge-green' : 'badge-red'}`}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-gray-700">{mcq.explanation}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              {!revealed ? (
                <>
                  <button onClick={skipQuestion} className="btn-secondary gap-2 py-2.5 text-sm">
                    <SkipForward className="h-4 w-4" /> Skip
                  </button>
                  {selected && mode !== 'practice' && (
                    <button onClick={revealAnswer} className="btn-primary flex-1 justify-center py-2.5 text-sm">
                      Check answer
                    </button>
                  )}
                  {mode === 'practice' && selected && (
                    <button onClick={goNext} className="btn-primary flex-1 justify-center py-2.5 text-sm">
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </>
              ) : (
                <button onClick={goNext} className="btn-primary flex-1 justify-center py-2.5 text-sm">
                  {current < questions.length - 1 ? <>Next question <ChevronRight className="h-4 w-4" /></> : 'See results'}
                </button>
              )}
            </div>
          </div>

          {/* Question map sidebar */}
          <div className="card p-4 h-fit">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Question map</p>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((q, i) => {
                let color = 'bg-gray-100 text-gray-500'
                if (q.skipped) color = 'bg-warning-light text-warning'
                else if (q.revealed && q.selected === q.mcq.correct_answer) color = 'bg-success-light text-success'
                else if (q.revealed) color = 'bg-danger-light text-danger'
                else if (i === current) color = 'bg-brand-700 text-white'
                return (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`h-8 w-full rounded-lg text-xs font-semibold transition ${color}`}>
                    {i + 1}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 space-y-1.5 text-xs">
              {[
                ['bg-brand-700', 'Current'],
                ['bg-success-light border border-success', 'Correct'],
                ['bg-danger-light border border-danger', 'Wrong'],
                ['bg-warning-light border border-warning', 'Skipped'],
                ['bg-gray-100', 'Not yet'],
              ].map(([color, label]) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`h-3.5 w-3.5 rounded ${color}`} />
                  <span className="text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Nav bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <button onClick={goPrev} disabled={current === 0} className="btn-secondary py-2 px-4 text-sm disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-500">{current + 1} / {questions.length}</span>
          <button onClick={goNext} className="btn-primary py-2 px-4 text-sm">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Exit confirm modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="card w-full max-w-sm p-6">
            <h3 className="mb-2 text-lg font-bold text-gray-900">End this session?</h3>
            <p className="mb-5 text-sm text-gray-500">Your progress will be saved and you can review your answers.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowExitConfirm(false)} className="btn-secondary flex-1 justify-center">Keep going</button>
              <button onClick={handleFinish} className="btn-danger flex-1 justify-center">End session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
