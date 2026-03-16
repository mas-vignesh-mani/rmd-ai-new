import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateCompletion } from '@/lib/ai/llm'
import { savePreferences } from '@/lib/db/preferences'
import { PDFParse } from 'pdf-parse'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, textContent, filePath, aiReportId } = await req.json()

  const serviceSupabase = createServiceClient()

  // Get text content (from direct paste or file)
  let content = textContent ?? ''
  if (!content && filePath) {
    const { data: fileData, error } = await serviceSupabase.storage
      .from('documents')
      .download(filePath)
    if (error) throw error

    if (filePath.endsWith('.pdf')) {
      const buffer = Buffer.from(await fileData.arrayBuffer())
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      content = result.text
    } else {
      content = await fileData.text()
    }
  }

  // Save upload record
  const { data: uploadRecord, error: uploadError } = await serviceSupabase
    .from('user_uploaded_reports')
    .insert({
      user_id: user.id,
      title: title ?? 'Uploaded Report',
      content,
      compared_report_id: aiReportId ?? null,
    })
    .select('upload_id')
    .single()

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const extractedPreferences: string[] = []

  // Extract preferences if we have an AI report to compare with
  if (aiReportId) {
    const { data: aiReport } = await serviceSupabase
      .from('reports')
      .select('content')
      .eq('report_id', aiReportId)
      .single()

    if (aiReport?.content?.markdown) {
      const aiText = (aiReport.content.markdown as string).slice(0, 2000)
      const userText = content.slice(0, 2000)

      const prefPrompt = `Compare these two versions of a financial report and identify the user's editing preferences.

AI-Generated Report:
${aiText}

User's Edited Version:
${userText}

Return ONLY a JSON array of 3-5 concise preference statements describing how the user modified the report.
Focus on: formatting style, structure, emphasis, content additions/removals, tone.
Example: ["prefers bullet points over prose", "adds SGD/USD exchange rate analysis"]

Return ONLY the JSON array, no other text.`

      const prefResponse = await generateCompletion(
        'You are analyzing differences between an AI-generated report and a human-edited version to extract user preferences.',
        prefPrompt,
        { maxTokens: 300, temperature: 0.2 }
      )

      try {
        const jsonMatch = prefResponse.match(/\[[\s\S]*\]/)
        const prefs = JSON.parse(jsonMatch?.[0] ?? '[]') as string[]
        extractedPreferences.push(...prefs)
        await savePreferences(user.id, prefs, uploadRecord.upload_id)
      } catch {
        console.error('Failed to parse preferences:', prefResponse)
      }
    }
  }

  return NextResponse.json({
    uploadId: uploadRecord.upload_id,
    extractedPreferences,
  })
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_uploaded_reports')
    .select('upload_id, title, uploaded_at, compared_report_id')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
