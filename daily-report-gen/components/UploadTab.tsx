'use client'

import { useState } from 'react'
import FileUpload from './FileUpload'

export default function UploadTab() {
  const [activeSection, setActiveSection] = useState<'documents' | 'user-report'>('documents')
  const [reportTitle, setReportTitle] = useState('')
  const [reportText, setReportText] = useState('')
  const [aiReportId, setAiReportId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ extractedPreferences: string[] } | null>(null)

  const handleUserReportUpload = async () => {
    if (!reportText.trim()) return
    setUploading(true)
    try {
      const res = await fetch('/api/user-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reportTitle || 'Uploaded Report',
          textContent: reportText,
          aiReportId: aiReportId || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setUploadResult(data)
        setReportText('')
        setReportTitle('')
        setAiReportId('')
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-800 pb-4">
        <button
          onClick={() => setActiveSection('documents')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeSection === 'documents'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Research Documents
        </button>
        <button
          onClick={() => setActiveSection('user-report')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeSection === 'user-report'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Upload Your Report
        </button>
      </div>

      {activeSection === 'documents' && (
        <div>
          <p className="text-gray-400 text-sm mb-4">
            Upload research documents (PDFs, text files) to build your knowledge base for chat and report generation.
          </p>
          <FileUpload />
        </div>
      )}

      {activeSection === 'user-report' && (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Upload your own edited report to help the AI learn your writing preferences.
          </p>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Report Title</label>
            <input
              type="text"
              value={reportTitle}
              onChange={e => setReportTitle(e.target.value)}
              placeholder="e.g., My Daily Report 2024-01-15"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">AI Report ID (optional)</label>
            <input
              type="text"
              value={aiReportId}
              onChange={e => setAiReportId(e.target.value)}
              placeholder="ID of AI-generated report you edited (for preference learning)"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Report Content</label>
            <textarea
              value={reportText}
              onChange={e => setReportText(e.target.value)}
              placeholder="Paste your report text here..."
              rows={12}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none font-mono"
            />
          </div>

          <button
            onClick={handleUserReportUpload}
            disabled={uploading || !reportText.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition"
          >
            {uploading ? 'Uploading...' : 'Upload Report'}
          </button>

          {uploadResult && (
            <div className="p-4 bg-gray-800 rounded-lg">
              <p className="text-green-400 text-sm font-medium">Report uploaded successfully</p>
              {uploadResult.extractedPreferences.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">Extracted preferences:</p>
                  <ul className="space-y-1">
                    {uploadResult.extractedPreferences.map((p, i) => (
                      <li key={i} className="text-xs text-gray-300">• {p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
