type Source = {
  article_id: string
  title?: string
  snippet?: string
  score?: number
  published_date?: string
}

export default function SourceChips({ sources }: { sources: Source[] }) {
  if (!sources.length) return null

  return (
    <div className="py-2 border-t border-gray-800">
      <p className="text-xs text-gray-500 mb-2">Sources</p>
      <div className="flex flex-wrap gap-2">
        {sources.map((s, i) => (
          <div
            key={s.article_id}
            className="group relative"
          >
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-md text-xs text-gray-300 cursor-default hover:bg-gray-700 transition">
              <span className="text-blue-400 font-mono">[D{i+1}]</span>
              {s.title ?? 'Document'}
              {s.score != null && (
                <span className="text-gray-500">{(s.score * 100).toFixed(0)}%</span>
              )}
            </span>
            {s.snippet && (
              <div className="absolute bottom-full left-0 mb-2 w-72 p-3 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-300 hidden group-hover:block z-10 shadow-xl">
                {s.published_date && <p className="text-gray-500 mb-1">{s.published_date}</p>}
                {s.snippet}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
