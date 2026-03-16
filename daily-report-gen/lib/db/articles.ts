import { createServiceClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/ai/embed'

export async function saveArticle(params: {
  userId: string
  title: string
  content: string
  sourceUrl?: string
  publishedDate?: string
  metadata?: Record<string, unknown>
}): Promise<string> {
  const supabase = createServiceClient()

  // Create summary for embedding (first 500 words)
  const summaryText = params.content.split(/\s+/).slice(0, 500).join(' ')
  const embedding = await embedText(summaryText)

  const { data, error } = await supabase
    .from('news_articles')
    .insert({
      user_id: params.userId,
      title: params.title,
      content: params.content,
      source_url: params.sourceUrl,
      published_date: params.publishedDate ?? new Date().toISOString(),
      embedding,
      metadata: params.metadata ?? {},
    })
    .select('article_id')
    .single()

  if (error) throw error
  return data.article_id
}

export async function getUserArticles(userId: string, limit = 20) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('news_articles')
    .select('article_id, title, metadata, published_date, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}
