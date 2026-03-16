'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type TextUIPart } from 'ai'
import { useState } from 'react'
import SourceChips from './SourceChips'

type Source = {
  article_id: string
  title?: string
  snippet?: string
  score?: number
  published_date?: string
}

export default function Chat() {
  const [sources, setSources] = useState<Source[]>([])
  const [input, setInput] = useState('')

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      fetch: async (url, init) => {
        const response = await fetch(url, init)
        const sourcesHeader = response.headers.get('X-Sources')
        if (sourcesHeader) {
          try { setSources(JSON.parse(sourcesHeader)) } catch {}
        }
        return response
      },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg">Ask a question about your uploaded documents</p>
            <p className="text-sm mt-2">Upload documents in the Upload tab first</p>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl px-4 py-3 rounded-xl text-sm whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-100'
            }`}>
              {m.parts
                .filter((p): p is TextUIPart => p.type === 'text')
                .map((p, i) => <span key={i}>{p.text}</span>)
              }
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-400 px-4 py-3 rounded-xl text-sm">Thinking...</div>
          </div>
        )}
      </div>

      {sources.length > 0 && <SourceChips sources={sources} />}

      <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t border-gray-800">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about recent market movements, news, economic data..."
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
        >
          Send
        </button>
      </form>
    </div>
  )
}
