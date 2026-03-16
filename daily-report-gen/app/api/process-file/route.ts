import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateCompletion } from '@/lib/ai/llm'
import { saveArticle } from '@/lib/db/articles'
import { PDFParse } from 'pdf-parse'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { filePath, fileName, contentType } = await req.json()

  try {
    // Download file from Supabase Storage
    const serviceSupabase = createServiceClient()
    const { data: fileData, error: downloadError } = await serviceSupabase.storage
      .from('documents')
      .download(filePath)

    if (downloadError) throw downloadError

    // Extract text
    let textContent = ''
    if (contentType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const buffer = Buffer.from(await fileData.arrayBuffer())
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      textContent = result.text
    } else {
      textContent = await fileData.text()
    }

    // Truncate for evaluation
    const truncated = textContent.split(/\s+/).slice(0, 4000).join(' ')

    // Evaluate usefulness via Claude
    const evalPrompt = `Evaluate the following document for its usefulness as a financial research source.

Return ONLY valid JSON with this exact structure:
{
  "summary": "2-4 sentence summary",
  "usefulnessScore": 0.0,
  "documentType": "news_article|research_report|market_data|other",
  "source": "publication or source name if identifiable",
  "region": "primary geographic region"
}

The usefulnessScore should be 0.0-1.0 based on:
- Financial relevance (market data, economic indicators, company news)
- Timeliness (recent, current events preferred)
- Analytical depth (quantitative data, analysis preferred over opinion)
- Actionable insights for portfolio/risk management

Document:
${truncated}`

    const evalResponse = await generateCompletion(
      'You are a financial research assistant evaluating documents for relevance and usefulness.',
      evalPrompt,
      { maxTokens: 500, temperature: 0.1 }
    )

    let evaluation: {
      summary: string
      usefulnessScore: number
      documentType: string
      source: string
      region: string
    }

    try {
      const jsonMatch = evalResponse.match(/\{[\s\S]*\}/)
      evaluation = JSON.parse(jsonMatch?.[0] ?? evalResponse)
    } catch {
      evaluation = {
        summary: 'Document processed',
        usefulnessScore: 0.5,
        documentType: 'other',
        source: 'unknown',
        region: 'global',
      }
    }

    const USEFULNESS_THRESHOLD = 0.5
    let articleId: string | null = null

    if (evaluation.usefulnessScore >= USEFULNESS_THRESHOLD) {
      articleId = await saveArticle({
        userId: user.id,
        title: fileName.replace(/\.[^/.]+$/, ''),
        content: textContent,
        metadata: {
          documentType: evaluation.documentType,
          source: evaluation.source,
          region: evaluation.region,
          summary: evaluation.summary,
          usefulnessScore: evaluation.usefulnessScore,
          storagePath: filePath,
        },
      })
    }

    return NextResponse.json({
      fileId: articleId,
      fileName,
      status: articleId ? 'saved' : 'evaluated',
      message: articleId
        ? 'Document saved and indexed'
        : `Below usefulness threshold (${evaluation.usefulnessScore.toFixed(2)})`,
      summary: evaluation.summary,
      usefulnessScore: evaluation.usefulnessScore,
      documentType: evaluation.documentType,
      savedToStorage: !!articleId,
    })
  } catch (err) {
    console.error('process-file error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Processing failed' },
      { status: 500 }
    )
  }
}
