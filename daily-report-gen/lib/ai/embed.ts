import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'

// Using OpenAI text-embedding-3-small (1536 dims)
const EMBEDDING_MODEL = openai.embedding('text-embedding-3-small')

export async function embedText(text: string): Promise<number[]> {
  // Truncate to ~8000 chars to stay within token limits
  const truncated = text.slice(0, 8000)
  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: truncated,
  })
  return embedding
}
