import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { createClient } from '@/lib/supabase/server'
import { hybridRetrieve } from '@/lib/db/retrieve'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages, topK = 8 }: { messages: UIMessage[]; topK?: number } = await req.json()

  // Extract the last user message text for retrieval
  const lastMessage = messages[messages.length - 1]
  const query = lastMessage.parts
    .filter(p => p.type === 'text')
    .map(p => (p as { type: 'text'; text: string }).text)
    .join(' ')

  // Retrieve relevant documents
  const docs = await hybridRetrieve(query, user.id, topK)

  // Build context
  const context = docs.map((d, i) =>
    `[D${i+1}] title="${d.title ?? 'Unknown'}" date="${d.published_date ?? 'unknown'}"\n${d.snippet}`
  ).join('\n\n')

  const systemPrompt = `You are a financial research assistant. Answer questions based on the provided documents.
When citing information, use [D1], [D2], etc. to reference specific documents.
If the documents don't contain relevant information, say so clearly.

Documents:
${context}`

  const result = streamText({
    model: anthropic('claude-3-5-haiku-20241022'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 2000,
    temperature: 0.3,
  })

  return result.toUIMessageStreamResponse({
    headers: {
      'X-Sources': JSON.stringify(docs),
    },
  })
}
