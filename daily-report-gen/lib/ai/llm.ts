import { generateText, streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const DEFAULT_MODEL = anthropic('claude-3-5-haiku-20241022')
const HIGH_QUALITY_MODEL = anthropic('claude-3-5-sonnet-20241022')

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  options: { highQuality?: boolean; maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const { text } = await generateText({
    model: options.highQuality ? HIGH_QUALITY_MODEL : DEFAULT_MODEL,
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: options.maxTokens ?? 4000,
    temperature: options.temperature ?? 0.3,
  })
  return text
}

// For streaming responses (used in chat API route)
export { streamText, anthropic }
