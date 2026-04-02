'use client'
import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, BookOpen } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface UploadResult {
  success: number
  failed: number
  errors: string[]
}

export default function AdminUploadPage() {
  const [file, setFile]         = useState<File | null>(null)
  const [subjectId, setSubjectId] = useState('')
  const [subjects, setSubjects]   = useState<any[]>([])
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<UploadResult | null>(null)
  const [dragOver, setDragOver]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Load subjects on mount
  useState(() => {
    fetch('/api/admin/subjects').then(r => r.json()).then(setSubjects)
  })

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.xlsx') || f?.name.endsWith('.csv')) setFile(f)
    else toast.error('Please upload an .xlsx or .csv file')
  }

  async function handleUpload() {
    if (!file) { toast.error('Please select a file'); return }
    if (!subjectId) { toast.error('Please select a subject'); return }
    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('subjectId', subjectId)

    const res = await fetch('/api/admin/upload-mcqs', { method: 'POST', body: formData })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { toast.error(data.error || 'Upload failed'); return }
    setResult(data)
    if (data.success > 0) toast.success(`${data.success} MCQs uploaded successfully!`)
    if (data.failed > 0) toast.error(`${data.failed} rows had errors`)
  }

  const yearGroups: Record<string, any[]> = {}
  subjects.forEach(s => {
    const y = s.year || 'Other'
    if (!yearGroups[y]) yearGroups[y] = []
    yearGroups[y].push(s)
  })

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
          <span className="badge-blue px-3 py-1 text-sm font-medium">Admin Panel</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Upload MCQs</h1>
          <p className="mt-1 text-gray-500">Bulk upload from your Excel template. One subject at a time.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upload area */}
          <div className="lg:col-span-2 space-y-5">
            {/* Subject selector */}
            <div className="card p-5">
              <label className="label text-base font-semibold">1. Select subject</label>
              <select className="input mt-2" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                <option value="">Choose a subject...</option>
                {Object.entries(yearGroups).map(([year, subs]) => (
                  <optgroup key={year} label={year}>
                    {subs.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* File drop */}
            <div className="card p-5">
              <label className="label text-base font-semibold">2. Upload Excel file (.xlsx)</label>
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition
                  ${dragOver ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'}`}
              >
                <FileSpreadsheet className={`mb-3 h-10 w-10 ${dragOver ? 'text-brand-600' : 'text-gray-300'}`} />
                {file ? (
                  <>
                    <p className="font-medium text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-600">Drop your Excel file here</p>
                    <p className="text-sm text-gray-400">or click to browse · .xlsx or .csv</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden"
                onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
            </div>

            {/* Upload button */}
            <button onClick={handleUpload} disabled={loading || !file || !subjectId}
              className="btn-primary w-full justify-center py-3 text-base">
              {loading
                ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                : <><Upload className="h-5 w-5" /> Upload MCQs</>
              }
            </button>

            {/* Result */}
            {result && (
              <div className={`card p-5 ${result.failed === 0 ? 'border-success-light' : 'border-warning-light'}`}>
                <div className="flex items-center gap-3 mb-3">
                  {result.failed === 0
                    ? <CheckCircle className="h-5 w-5 text-success" />
                    : <AlertCircle className="h-5 w-5 text-warning" />
                  }
                  <span className="font-semibold text-gray-900">Upload complete</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-lg bg-success-light p-3 text-center">
                    <div className="text-2xl font-bold text-success">{result.success}</div>
                    <div className="text-xs text-success-dark">MCQs uploaded</div>
                  </div>
                  <div className="rounded-lg bg-danger-light p-3 text-center">
                    <div className="text-2xl font-bold text-danger">{result.failed}</div>
                    <div className="text-xs text-danger-dark">rows failed</div>
                  </div>
                </div>
                {result.errors.length > 0 && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-500 max-h-32 overflow-y-auto">
                    {result.errors.map((e, i) => <div key={i}>Row {i + 2}: {e}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column guide */}
          <div className="card p-5 h-fit">
            <h3 className="font-semibold text-gray-900 mb-4">Required Excel columns</h3>
            <div className="space-y-2">
              {[
                ['MCQ_ID',         'e.g. ANAT-001',     true],
                ['Question',       'Full question text', true],
                ['Option_A',       '',                   true],
                ['Option_B',       '',                   true],
                ['Option_C',       '',                   true],
                ['Option_D',       '',                   true],
                ['Option_E',       'Optional 5th option',false],
                ['Correct_Answer', 'A, B, C, D, or E',   true],
                ['Explanation',    'Full explanation',   false],
                ['Chapter',        '',                   false],
                ['Topic',          '',                   false],
                ['Difficulty',     'Easy/Medium/Hard',   false],
                ['Tags',           'Comma-separated',    false],
              ].map(([col, hint, required]) => (
                <div key={col as string} className="flex items-start justify-between gap-2">
                  <div>
                    <code className="text-xs font-mono text-brand-700">{col as string}</code>
                    {hint && <p className="text-xs text-gray-400">{hint as string}</p>}
                  </div>
                  <span className={`badge text-xs shrink-0 ${required ? 'badge-red' : 'badge-gray'}`}>
                    {required ? 'Required' : 'Optional'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-brand-50 p-3 text-xs text-brand-700">
              Row 1 must be headers. Data starts from Row 2. Save as .xlsx before uploading.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
