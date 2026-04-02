import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Auth check — admin only
    const authHeader = req.headers.get('cookie') || ''
    // In production this is handled by middleware; for now we trust the admin panel

    const formData = await req.formData()
    const file      = formData.get('file') as File
    const subjectId = formData.get('subjectId') as string

    if (!file || !subjectId) {
      return NextResponse.json({ error: 'File and subject required' }, { status: 400 })
    }

    // Parse Excel / CSV
    const buffer    = Buffer.from(await file.arrayBuffer())
    const workbook  = XLSX.read(buffer, { type: 'buffer' })
    const sheet     = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data rows found in file' }, { status: 400 })
    }

    // Get existing MCQ codes to avoid duplicates
    const { data: existingCodes } = await supabase
      .from('mcqs').select('mcq_code').eq('subject_id', subjectId)
    const codeSet = new Set(existingCodes?.map(r => r.mcq_code) || [])

    const toInsert: any[] = []
    const errors: string[] = []

    rows.forEach((row, i) => {
      const rowNum = i + 2  // Excel row number

      // Normalise column names (case-insensitive, handle spaces/underscores)
      const get = (key: string): string => {
        const variations = [
          key, key.toLowerCase(), key.toUpperCase(),
          key.replace('_', ' '), key.replace(' ', '_'),
        ]
        for (const v of variations) {
          if (row[v] !== undefined && row[v] !== '') return String(row[v]).trim()
        }
        return ''
      }

      const question = get('Question') || get('question')
      const optA     = get('Option_A') || get('Option A') || get('option_a')
      const optB     = get('Option_B') || get('Option B') || get('option_b')
      const optC     = get('Option_C') || get('Option C') || get('option_c')
      const optD     = get('Option_D') || get('Option D') || get('option_d')
      const optE     = get('Option_E') || get('Option E') || get('option_e')
      const correct  = (get('Correct_Answer') || get('Correct Answer') || get('correct_answer')).toUpperCase()
      const mcqCode  = get('MCQ_ID') || get('MCQ_Code') || get('mcq_id')

      // Validation
      if (!question) { errors.push(`Row ${rowNum}: Missing question`); return }
      if (!optA || !optB || !optC || !optD) { errors.push(`Row ${rowNum}: Missing options A-D`); return }
      if (!['A','B','C','D','E'].includes(correct)) { errors.push(`Row ${rowNum}: Correct_Answer must be A, B, C, D, or E`); return }
      if (correct === 'E' && !optE) { errors.push(`Row ${rowNum}: Answer is E but Option_E is empty`); return }
      if (mcqCode && codeSet.has(mcqCode)) { errors.push(`Row ${rowNum}: MCQ_ID "${mcqCode}" already exists — skipped`); return }

      // Tags — comma-separated string to array
      const tagsRaw = get('Tags') || get('tags')
      const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []

      // Difficulty
      const diffRaw = (get('Difficulty') || get('difficulty') || 'Medium')
      const difficulty = ['Easy','Medium','Hard'].includes(diffRaw) ? diffRaw : 'Medium'

      toInsert.push({
        mcq_code:       mcqCode || null,
        subject_id:     subjectId,
        chapter:        get('Chapter') || get('chapter') || null,
        topic:          get('Topic')   || get('topic')   || null,
        question,
        option_a:       optA,
        option_b:       optB,
        option_c:       optC,
        option_d:       optD,
        option_e:       optE || null,
        correct_answer: correct,
        explanation:    get('Explanation') || get('explanation') || null,
        difficulty,
        tags,
        is_active:      true,
      })
    })

    // Batch insert (1000 rows at a time)
    let successCount = 0
    const batchSize = 1000

    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize)
      const { data, error } = await supabase.from('mcqs').insert(batch).select('id')
      if (error) {
        errors.push(`Batch ${Math.floor(i/batchSize)+1} error: ${error.message}`)
      } else {
        successCount += data?.length || 0
      }
    }

    return NextResponse.json({
      success: successCount,
      failed: rows.length - successCount,
      errors: errors.slice(0, 50),  // return max 50 errors
    })

  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
