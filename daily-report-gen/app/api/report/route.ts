import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateReport } from '@/lib/report/generator'
import { createReport, updateReport } from '@/lib/db/reports'
import { getUserPreferences } from '@/lib/db/preferences'
import { getUserArticles } from '@/lib/db/articles'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { customPrompt, excelData, fileIds } = await req.json()

  const reportId = await createReport(user.id, `Daily Report ${new Date().toLocaleDateString()}`)

  // Run generation asynchronously (return reportId immediately)
  generateReportAsync(user.id, reportId, { customPrompt, excelData, fileIds })
    .catch(err => {
      console.error('Report generation failed:', err)
      updateReport(reportId, { status: 'failed' })
    })

  return NextResponse.json({ reportId, status: 'processing' })
}

async function generateReportAsync(
  userId: string,
  reportId: string,
  options: { customPrompt?: string; excelData?: unknown; fileIds?: string[] }
) {
  const [preferences, articles] = await Promise.all([
    getUserPreferences(userId),
    getUserArticles(userId, 20),
  ])

  const markdown = await generateReport({
    articles,
    preferences,
    customPrompt: options.customPrompt,
    excelData: options.excelData as Parameters<typeof generateReport>[0]['excelData'],
  })

  await updateReport(reportId, {
    status: 'completed',
    content: { markdown },
    completedAt: new Date().toISOString(),
  })
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const reportId = searchParams.get('reportId')

  if (reportId) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('report_id', reportId)
      .eq('user_id', user.id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('reports')
    .select('report_id, title, status, created_at, completed_at, content')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
