import { createServiceClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/ai/embed'
import { parseTemporalQuery } from '@/lib/ai/temporal'

export type RetrievedDoc = {
  article_id: string
  title: string | null
  snippet: string
  score: number
  published_date: string | null
}

export async function hybridRetrieve(
  query: string,
  userId: string,
  topK: number = 8
): Promise<RetrievedDoc[]> {
  const supabase = createServiceClient()
  const { dateFrom, dateTo } = parseTemporalQuery(query)

  // Embed the query
  const embedding = await embedText(query)

  // Run hybrid retrieval via a PostgreSQL function
  const { data, error } = await supabase.rpc('hybrid_search', {
    query_text: query,
    query_embedding: embedding,
    p_user_id: userId,
    date_from: dateFrom?.toISOString() ?? null,
    date_to: dateTo?.toISOString() ?? null,
    match_count: topK,
    lexical_weight: 0.55,
    semantic_weight: 0.45,
  })

  if (error) throw error
  return data as RetrievedDoc[]
}
