'use client'

import ReactMarkdown from 'react-markdown'

type Report = {
  report_id: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  completed_at: string | null
  content: { markdown?: string } | null
}

export default function ReportDisplay({ report }: { report: Report }) {
  if (report.status === 'processing' || report.status === 'pending') {
    return (
      <div className="flex items-center gap-3 p-6 bg-gray-800 rounded-xl">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-300">Generating report...</span>
      </div>
    )
  }

  if (report.status === 'failed') {
    return (
      <div className="p-6 bg-red-900/20 border border-red-800 rounded-xl">
        <p className="text-red-400">Report generation failed. Please try again.</p>
      </div>
    )
  }

  const markdown = report.content?.markdown

  if (!markdown) {
    return (
      <div className="p-6 bg-gray-800 rounded-xl">
        <p className="text-gray-400">No content available.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-white">{report.title}</h2>
        <button
          onClick={() => {
            const blob = new Blob([markdown], { type: 'text/markdown' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${report.title}.md`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="text-sm text-blue-400 hover:text-blue-300 transition"
        >
          Download .md
        </button>
      </div>
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  )
}
