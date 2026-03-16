import { generateCompletion } from '@/lib/ai/llm'

type Article = {
  article_id: string
  title: string | null
  metadata: Record<string, unknown> | null
  published_date: string | null
  created_at: string
}

type ExcelSheet = {
  headers: string[]
  rows: Record<string, unknown>[]
}

type ExcelData = {
  daily?: ExcelSheet
  monthly?: ExcelSheet
  quarterly?: ExcelSheet
}

export async function generateReport(params: {
  articles: Article[]
  preferences: string[]
  customPrompt?: string
  excelData?: ExcelData | null
  highQuality?: boolean
}): Promise<string> {
  const { articles, preferences, customPrompt, excelData, highQuality } = params

  // Format news content
  const newsContent = articles
    .slice(0, 15)
    .map((a, i) =>
      `[Article ${i+1}] ${a.title ?? 'Untitled'} (${a.published_date ?? a.created_at})\n` +
      `Type: ${(a.metadata as Record<string, unknown>)?.documentType ?? 'unknown'}\n` +
      `Summary: ${(a.metadata as Record<string, unknown>)?.summary ?? 'No summary available'}`
    )
    .join('\n\n')

  // Format time series / Excel data
  let marketDataContent = ''
  if (excelData) {
    const formatSheet = (name: string, sheet: ExcelSheet | undefined) => {
      if (!sheet?.rows?.length) return ''
      const header = `### ${name}\n| ${sheet.headers.join(' | ')} |\n| ${sheet.headers.map(() => '---').join(' | ')} |`
      const rows = sheet.rows.map(r => `| ${sheet.headers.map(h => String(r[h] ?? '')).join(' | ')} |`).join('\n')
      return `${header}\n${rows}`
    }
    marketDataContent = [
      formatSheet('Daily Market Data', excelData.daily),
      formatSheet('Monthly Indicators', excelData.monthly),
      formatSheet('Quarterly Data', excelData.quarterly),
    ].filter(Boolean).join('\n\n')
  }

  // Build system prompt
  const preferencesSection = preferences.length > 0
    ? `\n\nUser preferences (apply these to your writing style and structure):\n${preferences.map(p => `- ${p}`).join('\n')}`
    : ''

  const customSection = customPrompt
    ? `\n\nAdditional instructions for this report:\n${customPrompt}`
    : ''

  const systemPrompt = `You are a professional financial analyst writing a daily market report.
Generate a comprehensive, well-structured report in Markdown format.
Use ## for main sections, ### for subsections, and tables where appropriate.
Be analytical, precise, and data-driven.${preferencesSection}${customSection}`

  const userPrompt = `Generate a complete daily financial report with these sections:
1. Executive Summary
2. Market Overview
3. Key News & Events
4. Economic Indicators
5. Outlook

Available News Articles:
${newsContent || 'No news articles available.'}

${marketDataContent ? `Market Data:\n${marketDataContent}` : 'No market data provided.'}`

  return generateCompletion(systemPrompt, userPrompt, {
    highQuality,
    maxTokens: 4000,
    temperature: 0.3,
  })
}
